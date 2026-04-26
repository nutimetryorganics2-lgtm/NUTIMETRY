from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging
import json
import uuid

logger = logging.getLogger("api")

class JSONLogFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "name": record.name
        }
        # Include any extra attributes added to the log record
        if hasattr(record, "request_id"):
            log_obj["request_id"] = record.request_id
        if hasattr(record, "client_ip"):
            log_obj["client_ip"] = record.client_ip
        if hasattr(record, "latency_s"):
            log_obj["latency_s"] = record.latency_s
        return json.dumps(log_obj)

# Re-configure structured logger
logHandler = logging.StreamHandler()
logHandler.setFormatter(JSONLogFormatter())
logging.getLogger().handlers = []
logging.getLogger().addHandler(logHandler)
logging.getLogger().setLevel(logging.INFO)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start_time = time.time()
        client_ip = request.client.host if request.client else "unknown"
        
        # Inject request_id into state
        request.state.request_id = request_id
        
        # Bind context to a custom logger adapter for this request
        extra = {"request_id": request_id, "client_ip": client_ip}
        req_logger = logging.LoggerAdapter(logger, extra)
        
        req_logger.info(f"Request Started: {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Inject Request-ID into headers
            response.headers["X-Request-ID"] = request_id
            
            extra["latency_s"] = round(process_time, 4)
            req_logger.info(f"Request Completed: {response.status_code} {request.method} {request.url.path}")
            return response
        except Exception as e:
            process_time = time.time() - start_time
            extra["latency_s"] = round(process_time, 4)
            req_logger.error(f"Request Failed: {request.method} {request.url.path} | Error: {str(e)}")
            raise e
