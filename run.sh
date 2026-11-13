#!/usr/bin/env bash
set -e

# Change to script directory
cd "$(dirname "$0")"

echo "=========================================================="
echo "      🚀 NL2SQL Studio — Natural to SQL Engine"
echo "=========================================================="

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Ensure database is ready
echo "🌱 Verifying database readiness..."
python3 -c "from backend.database import db_manager; db_manager._ensure_database_ready()"

# Check if frontend is built
if [ ! -d "frontend/dist" ]; then
    echo "🔨 Building frontend production assets..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run build
    cd ..
else
    echo "✓ Frontend assets compiled"
fi

echo "=========================================================="
echo "✨ Server starting at http://localhost:8000"
echo "   - Web Interface: http://localhost:8000"
echo "   - Interactive API Docs: http://localhost:8000/docs"
echo "=========================================================="

# Start FastAPI server (serves both API & Frontend)
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
