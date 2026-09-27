from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional

# ---- Auth ----
class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    class Config: from_attributes = True

# ---- Exercises ----
class ExerciseOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    difficulty: Optional[str] = None
    target_muscles: Optional[str] = None
    instructions: Optional[str] = None
    form_tips: Optional[str] = None
    common_mistakes: Optional[str] = None
    recommended_reps: int
    category: str
    image: str
    class Config: from_attributes = True

# ---- AI Analysis ----
class FrameIn(BaseModel):
    session_id: str
    exercise: str = "squat"
    image_base64: str          # JPEG data URL or raw base64

class AnalysisOut(BaseModel):
    exercise: str
    rep_count: int
    state: str
    form_score: int
    status: str                # good | warning | error | no_pose
    feedback: list[str]
    pose_detected: bool
    landmarks: Optional[list[dict]] = None   # for skeleton overlay

class SessionStartIn(BaseModel):
    exercise: str = "squat"

class SessionOut(BaseModel):
    session_id: str
    exercise: str

# ---- Workouts ----
class WorkoutSaveIn(BaseModel):
    exercise_id: int
    duration: int
    reps: int
    form_score: float
    feedback: list[dict] = []  # [{text, type}]

class WorkoutOut(BaseModel):
    id: int
    exercise_id: int
    exercise_name: str
    duration: int
    reps: int
    form_score: float
    created_at: datetime

class WorkoutDetailOut(WorkoutOut):
    feedback: list[dict]

# ---- Progress / Profile ----
class ProgressOut(BaseModel):
    total_workouts: int
    total_reps: int
    total_duration: int
    avg_form_score: float
    current_streak: int
    weekly: list[dict]         # [{day, reps, form_score, workouts}]
    by_exercise: list[dict]

class ProfileOut(BaseModel):
    name: str
    email: str
    fitness_goal: str
    preferred_workout: str
    profile_image: Optional[str] = None
    total_workouts: int = 0
    total_reps: int = 0
    current_streak: int = 0
    avg_form_score: float = 0.0

class ProfileUpdateIn(BaseModel):
    name: Optional[str] = None
    fitness_goal: Optional[str] = None
    preferred_workout: Optional[str] = None
    profile_image: Optional[str] = None