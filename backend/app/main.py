from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import Base, engine
from app.api.routes import auth, analysis, workouts, progress, profile

Base.metadata.create_all(bind=engine)
settings = get_settings()

app = FastAPI(title="FitForm AI API", version="1.0.0",
              description="AI-powered workout tracking and exercise-form guidance.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(analysis.router)
app.include_router(workouts.router)
app.include_router(progress.router)
app.include_router(profile.router)

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "FitForm AI"}