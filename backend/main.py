# main.py
import sys
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.api import routes as api_routes

app = FastAPI()

# CORS (Cross-Origin Resource Sharing) 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 포함
app.include_router(api_routes.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "AI Battle Arena Backend"}

if __name__ == "__main__":
    print("Starting FastAPI server on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
