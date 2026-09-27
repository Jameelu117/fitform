from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Workout, Exercise
from app.schemas.schemas import ProgressOut
from app.services.workout_service import compute_streak

router = APIRouter(prefix="/api", tags=["progress"])

@router.get("/progress", response_model=ProgressOut)
def progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workouts = db.query(Workout).filter(Workout.user_id == user.id).all()
    total_reps = sum(w.reps for w in workouts)
    total_dur = sum(w.duration for w in workouts)
    avg_form = round(sum(w.form_score for w in workouts) / len(workouts), 1) if workouts else 0

    # Last 7 days
    weekly = []
    for i in range(6, -1, -1):
        day = date.today() - timedelta(days=i)
        day_w = [w for w in workouts if w.created_at.date() == day]
        weekly.append({
            "day": day.strftime("%a").upper(),
            "reps": sum(w.reps for w in day_w),
            "workouts": len(day_w),
            "form_score": round(sum(w.form_score for w in day_w) / len(day_w), 0) if day_w else 0,
        })

    # Per exercise
    by_exercise = []
    rows = (db.query(Exercise.name, func.count(Workout.id), func.avg(Workout.form_score),
                     func.sum(Workout.reps))
            .join(Workout, Workout.exercise_id == Exercise.id)
            .filter(Workout.user_id == user.id)
            .group_by(Exercise.name).all())
    for name, count, avg, reps in rows:
        by_exercise.append({"name": name, "workouts": count,
                            "avg_form": round(float(avg), 1), "reps": int(reps or 0)})

    return ProgressOut(
        total_workouts=len(workouts), total_reps=total_reps, total_duration=total_dur,
        avg_form_score=avg_form, current_streak=compute_streak(db, user.id),
        weekly=weekly, by_exercise=by_exercise)
