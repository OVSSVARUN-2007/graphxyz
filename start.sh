#!/bin/bash
# Graphx Startup Script
echo "=========================================================="
echo " Starting Graphx: AI Equation & Text-to-Graph Generator  "
echo "=========================================================="

# Check Python and Node
python3 --version
node --version

# Start FastAPI backend (serving API + built frontend)
echo "Starting server on http://localhost:8000 ..."
python3 -m uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload

