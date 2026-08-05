from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import calendar, family, weather

app = FastAPI(
    title="Dashy API",
    description="Family Calendar Dashboard API",
    version="0.1.0",
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dashy.local",
        "http://localhost:3000",
        "http://dashy.local",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(calendar.router)
app.include_router(weather.router)
app.include_router(family.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}


@app.get("/")
def root():
    return {"message": "Dashy API is running"}
