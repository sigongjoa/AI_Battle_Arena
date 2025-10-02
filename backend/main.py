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
from .grpc_server import start_grpc_server

app = FastAPI()

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "AI Battle Arena Backend is running."}

app.include_router(api_routes.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    print("Starting gRPC server on port 50052...")
    asyncio.create_task(start_grpc_server(port=50052))

if __name__ == "__main__":
    print("Starting FastAPI server on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
