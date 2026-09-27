from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Profile, Workout
from app.schemas.schemas import ProfileOut, ProfileUpdateIn
from app.services.workout_service import compute_streak

router = APIRouter(prefix="/api", tags=["profile"])

def _to_out(user: User, db: Session) -> ProfileOut:
    p = user.profile
    ws = db.query(Workout).filter(Workout.user_id == user.id).all()
    return ProfileOut(
        name=user.name, email=user.email,
        fitness_goal=p.fitness_goal if p else "General fitness",
        preferred_workout=p.preferred_workout if p else "Strength",
        profile_image=p.profile_image if p else None,
        total_workouts=len(ws), total_reps=sum(w.reps for w in ws),
        current_streak=compute_streak(db, user.id),
        avg_form_score=round(sum(w.form_score for w in ws) / len(ws), 1) if ws else 0.0)

@router.get("/profile", response_model=ProfileOut)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _to_out(user, db)

@router.put("/profile", response_model=ProfileOut)
def update_profile(data: ProfileUpdateIn, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    if data.name: user.name = data.name
    p = user.profile or Profile(user_id=user.id)
    if data.fitness_goal: p.fitness_goal = data.fitness_goal
    if data.preferred_workout: p.preferred_workout = data.preferred_workout
    if data.profile_image is not None: p.profile_image = data.profile_image
    if not user.profile: db.add(p)
    db.commit(); db.refresh(user)
    return _to_out(user, db)
