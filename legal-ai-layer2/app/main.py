from dotenv import load_dotenv
load_dotenv()  # MUST be first

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.api.routes import router as api_router
from app.routers.auth_router import router as auth_router

app = FastAPI(
    title="Legal AI – User Intelligence Layer",
    version="1.0"
)
from fastapi.staticfiles import StaticFiles
app.mount("/audio", StaticFiles(directory="audio"), name="audio")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:5174", 
        "http://127.0.0.1:5174",
        "http://localhost:3000", 
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router)
app.include_router(auth_router, prefix="/auth")

@app.get("/")
def health_check():
    return {"status": "User Backend Running 🚀"}