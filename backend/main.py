# main.py
import sys
import os
import asyncio
import uvicorn

# Add project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import routes as api_routes


if __name__ == "__main__":
    print("Starting FastAPI server on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
