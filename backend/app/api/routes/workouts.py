from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Exercise, Workout
from app.schemas.schemas import ExerciseOut, WorkoutSaveIn, WorkoutOut, WorkoutDetailOut
from app.services.workout_service import save_workout

router = APIRouter(prefix="/api/workouts", tags=["workouts"])

@router.get("/exercises", response_model=list[ExerciseOut])
def list_exercises(db: Session = Depends(get_db)):
    return db.query(Exercise).all()

@router.get("/exercises/{exercise_id}", response_model=ExerciseOut)
def get_exercise(exercise_id: int, db: Session = Depends(get_db)):
    ex = db.get(Exercise, exercise_id)
    if not ex:
        raise HTTPException(404, "Exercise not found")
    return ex

@router.post("", response_model=WorkoutOut, status_code=201)
def create_workout(data: WorkoutSaveIn, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    w = save_workout(db, user.id, data)
    return WorkoutOut(id=w.id, exercise_id=w.exercise_id, exercise_name=w.exercise.name,
                      duration=w.duration, reps=w.reps, form_score=w.form_score,
                      created_at=w.created_at)

@router.get("", response_model=list[WorkoutOut])
def history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (db.query(Workout).filter(Workout.user_id == user.id)
            .order_by(Workout.created_at.desc()).all())
    return [WorkoutOut(id=w.id, exercise_id=w.exercise_id, exercise_name=w.exercise.name,
                       duration=w.duration, reps=w.reps, form_score=w.form_score,
                       created_at=w.created_at) for w in rows]

@router.get("/{workout_id}", response_model=WorkoutDetailOut)
def workout_detail(workout_id: int, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    w = db.get(Workout, workout_id)
    if not w or w.user_id != user.id:
        raise HTTPException(404, "Workout not found")
    return WorkoutDetailOut(
        id=w.id, exercise_id=w.exercise_id, exercise_name=w.exercise.name,
        duration=w.duration, reps=w.reps, form_score=w.form_score, created_at=w.created_at,
        feedback=[{"text": f.feedback_text, "type": f.feedback_type} for f in w.feedback])
