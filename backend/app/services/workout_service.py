"""Session store for live analysis + workout persistence logic."""
import uuid
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Workout, FormFeedback, Progress, Exercise
from app.services.squat_analysis import SquatAnalyzer
from app.services.pushup_analysis import PushupAnalyzer
from app.services.lunge_analysis import LungeAnalyzer
from app.services.curl_analysis import CurlAnalyzer
from app.services.jumping_jack_analysis import JumpingJackAnalyzer

# In-memory analyzer sessions: {session_id: {"analyzer": ..., "exercise": ...}}
_sessions: dict[str, dict] = {}

# Maps the exercise slug (Exercise.image in the DB, sent by the frontend)
# to its live pose-analysis class.
ANALYZERS = {
    "squat": SquatAnalyzer,
    "pushup": PushupAnalyzer,
    "lunge": LungeAnalyzer,
    "curl": CurlAnalyzer,
    "jacks": JumpingJackAnalyzer,
}
SUPPORTED_ANALYSIS = set(ANALYZERS)

def create_session(exercise: str) -> str:
    sid = uuid.uuid4().hex
    analyzer_cls = ANALYZERS.get(exercise)
    if analyzer_cls is None:
        raise ValueError(f"No AI analyzer available for '{exercise}' yet — use Demo Mode.")
    _sessions[sid] = {"exercise": exercise, "analyzer": analyzer_cls()}
    return sid

def get_session(sid: str) -> dict | None:
    return _sessions.get(sid)

def end_session(sid: str) -> dict | None:
    return _sessions.pop(sid, None)

# save_workout, compute_streak unchanged — keep as-is

def save_workout(db: Session, user_id: int, data) -> Workout:
    w = Workout(user_id=user_id, exercise_id=data.exercise_id,
                duration=data.duration, reps=data.reps, form_score=data.form_score)
    db.add(w)
    db.flush()
    for fb in data.feedback:
        db.add(FormFeedback(workout_id=w.id,
                            feedback_text=fb.get("text", ""),
                            feedback_type=fb.get("type", "info")))
    today = date.today()
    prog = (db.query(Progress)
            .filter(Progress.user_id == user_id, Progress.workout_date == today)
            .first())
    if prog:
        prog.reps += data.reps
        prog.duration += data.duration
        prog.form_score = round((prog.form_score + data.form_score) / 2, 1)
    else:
        db.add(Progress(user_id=user_id, workout_date=today,
                        reps=data.reps, duration=data.duration, form_score=data.form_score))
    db.commit()
    db.refresh(w)
    return w

def compute_streak(db: Session, user_id: int) -> int:
    dates = [r[0] for r in db.query(Progress.workout_date)
             .filter(Progress.user_id == user_id)
             .order_by(Progress.workout_date.desc()).all()]
    if not dates:
        return 0
    streak, cursor = 0, date.today()
    if dates[0] == cursor - timedelta(days=1):
        cursor = dates[0]
    for d in dates:
        if d == cursor:
            streak += 1
            cursor -= timedelta(days=1)
        elif d < cursor:
            break
    return streak
