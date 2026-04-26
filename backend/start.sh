#!/bin/bash
# Production Startup Script for NutimetryOrganic Backend
# Usage: ./start.sh

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

PORT=${PORT:-8005}
LOG_LEVEL=${LOG_LEVEL:-info}

echo "🚀 Starting NutimetryOrganic Production Brain on port $PORT..."

# Run Gunicorn with Uvicorn workers for high-performance async handling
exec gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:$PORT \
    --log-level $LOG_LEVEL \
    --access-logfile -
