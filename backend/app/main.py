from fastapi import FastAPI, Request, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.db.session import connect_to_mongo, close_mongo_connection
from app.api.deps import get_db
from app.api import auth, products, orders, enquiry, content, health, user
from app.core.middleware import LoggingMiddleware
from fastapi.responses import JSONResponse
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
import logging

logger = logging.getLogger("api")

from sentry_sdk.integrations.asgi import SentryAsgiMiddleware

# Initialize Sentry for Production Monitoring
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0 if settings.ENVIRONMENT == "development" else 0.2,
        environment=settings.ENVIRONMENT,
        send_default_pii=True # Required for user context, but masking happens in PII config if needed
    )
    logger.info(f"Sentry APM integration enabled for {settings.ENVIRONMENT}")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title=settings.PROJECT_NAME,
    swagger_ui_parameters={"persistAuthorization": True},
    redirect_slashes=False
)
app.add_middleware(SentryAsgiMiddleware)

# OpenAPI Security Announcement
@app.on_event("startup")
async def configure_openapi():
    if not app.openapi_schema:
        from fastapi.openapi.utils import get_openapi
        app.openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            routes=app.routes,
        )
        app.openapi_schema["components"]["securitySchemes"] = {
            "OAuth2PasswordBearer": {
                "type": "oauth2",
                "flows": {
                    "password": {
                        "scopes": {},
                        "tokenUrl": "api/auth/login"
                    }
                }
            }
        }
        app.openapi_schema["security"] = [{"OAuth2PasswordBearer": []}]

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the full error for debugging
    logger.error(f"GLOBAL_ERROR: {request.method} {request.url.path} | {str(exc)}", exc_info=True)
    
    # 1. Handle FastAPI's built-in HTTPException
    from fastapi import HTTPException as FastAPIHTTPException
    from starlette.exceptions import HTTPException as StarletteHTTPException
    
    if isinstance(exc, (FastAPIHTTPException, StarletteHTTPException)):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False, 
                "message": str(exc.detail) if isinstance(exc.detail, str) else "A server error occurred",
                "data": None
            }
        )
        
    # 2. Handle Validation Errors (422)
    from fastapi.exceptions import RequestValidationError
    if isinstance(exc, RequestValidationError):
        # Extract the first error message for the user
        try:
            errors = exc.errors()
            first_error = errors[0]
            field = ".".join([str(loc) for loc in first_error.get("loc", []) if loc != "body"])
            msg = first_error.get("msg", "Validation failed")
            friendly_msg = f"Invalid {field}: {msg}" if field else msg
        except:
            friendly_msg = "Validation failed. Please check your input."
            
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "message": friendly_msg,
                "data": exc.errors()
            }
        )

    # 3. Catch-all for everything else (500)
    return JSONResponse(
        status_code=500,
        content={
            "success": False, 
            "message": "Something went wrong on our end. Please try again shortly.",
            "data": str(exc) if settings.ENVIRONMENT == "development" else None
        }
    )

@app.exception_handler(404)
async def custom_404_handler(request: Request, exc: Exception):
    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=404,
            content={
                "success": False, 
                "message": f"Endpoint '{request.url.path}' not found.",
                "data": None
            }
        )
    return JSONResponse(status_code=404, content={"detail": "Not Found"})

import time

# Secure Headers and Process Time Middleware
@app.middleware("http")
async def add_process_time_and_secure_headers_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL, 
        settings.STAGING_URL, 
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex="https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()
app.add_middleware(LoggingMiddleware)

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}

from fastapi.staticfiles import StaticFiles
import os

# Create upload directory if not exists
upload_dir = "static/uploads"
if not os.path.exists(upload_dir):
    os.makedirs(upload_dir)

# Routers
app.mount("/static", StaticFiles(directory="static"), name="static")
@app.get("/health")
async def health_status(db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        await db.command("ping")
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}

app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(auth.auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(enquiry.router, prefix="/api/enquiry", tags=["enquiry"])
app.include_router(content.router, prefix="/api/content", tags=["content"])

@app.on_event("startup")
async def debug_startup():
    logger.info(f"API initialized with {len(app.routes)} endpoints")

