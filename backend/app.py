"""
Core entry point for the Text Processing & Analysis Engine.
Handles initialization, middleware configuration, and routing.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Absolute package path imports matching the modular layout structure
from backend.routes.nlp_routes import text_router as text_processor_router
from backend.routes.embedding_routes import router as vector_space_router

# Completely brand new API metadata
server_instance = FastAPI(
    title="LexiClean Text Engineering API",
    description="An automated microservice engine built for textual data normalization and processing.",
    version="2.1.0",
)

# Cross-Origin Resource Sharing (CORS) setup
server_instance.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@server_instance.get("/status")
def verify_server_status() -> dict:
    """Verifies that the text processing microservice is online and responsive."""
    return {
        "status": "online",
        "service": "LexiClean Core Engine",
        "ready": True
    }


# Registering the backend route controllers with unique prefixes 
# This matches the route structures expected by your frontend javascript layer!
server_instance.include_router(text_processor_router, prefix="/api/v1/nlp")
server_instance.include_router(vector_space_router, prefix="/api/v1/vectors")


if __name__ == "__main__":
    # Standard local deployment setup running on port 8000
    uvicorn.run("backend.app:server_instance", host="127.0.0.1", port=8000, reload=True)