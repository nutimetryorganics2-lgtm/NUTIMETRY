import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NutimetryOrganic Platform"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development") # development, production
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    STAGING_URL: str = os.getenv("STAGING_URL", "http://localhost:3000")
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = "nutrimetry_db"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "NUTRIMETRY_PRODUCTION_SECRET_2024_!@#")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Email SMTP Settings
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    NOTIFICATION_EMAIL: str = os.getenv("NOTIFICATION_EMAIL", "BHANUNIDUMOL@GMAIL.COM")
    
    # Cloudinary
    CLOUDINARY_URL: str = os.getenv("CLOUDINARY_URL", "")

    class Config:
        env_file = ".env"

settings = Settings()
