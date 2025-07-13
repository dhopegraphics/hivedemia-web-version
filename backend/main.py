from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.api import (
    competition,
    course,
    topic,
    user,
    shared_notes,
    notification,
    answer,
)

# DB engine and base
from app.database.database import engine, Base

app = FastAPI(
    title="HIVEBACKIT API",
    version="1.0.0",
    description="Backend API for HIVEBACKIT – an AI-powered educational platform.",
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(competition.router)
app.include_router(course.router)
app.include_router(topic.router)
app.include_router(user.router)
app.include_router(shared_notes.router)
app.include_router(notification.router)
app.include_router(answer.router)

# Health check
@app.get("/")
async def root():
    return {"message": "Welcome to HIVEBACKIT API "}

# Startup event: create all tables
@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
