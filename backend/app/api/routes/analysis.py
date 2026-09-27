from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import FrameIn, AnalysisOut, SessionStartIn, SessionOut
from app.services import workout_service
from app.services.pose_detection import PoseDetector

router = APIRouter(prefix="/api", tags=["analysis"])
detector = PoseDetector()

@router.post("/workout/start", response_model=SessionOut)
def start_workout(data: SessionStartIn, user: User = Depends(get_current_user)):
    try:
        sid = workout_service.create_session(data.exercise)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return SessionOut(session_id=sid, exercise=data.exercise)

@router.post("/analyze-frame", response_model=AnalysisOut)
def analyze_frame(data: FrameIn, user: User = Depends(get_current_user)):
    session = workout_service.get_session(data.session_id)
    if not session:
        raise HTTPException(404, "Workout session not found. Start a new workout.")

    img = detector.decode_image(data.image_base64)
    if img is None:
        return AnalysisOut(exercise=data.exercise, rep_count=session["analyzer"].rep_count,
                           state=session["analyzer"].state, form_score=session["analyzer"].form_score,
                           status="error", feedback=["Could not read camera frame — check lighting."],
                           pose_detected=False)

    landmarks = detector.detect(img)
    if landmarks is None:
        return AnalysisOut(exercise=data.exercise, rep_count=session["analyzer"].rep_count,
                           state=session["analyzer"].state, form_score=session["analyzer"].form_score,
                           status="no_pose", feedback=["No pose detected — step back so your full body is visible."],
                           pose_detected=False)

    result = session["analyzer"].update(landmarks)
    return AnalysisOut(exercise=data.exercise, pose_detected=True, landmarks=landmarks, **{
        "rep_count": result["rep_count"], "state": result["state"],
        "form_score": result["form_score"], "status": result["status"],
        "feedback": result["feedback"],
    })

@router.post("/workout/end")
def end_workout(session_id: str, user: User = Depends(get_current_user)):
    session = workout_service.end_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")
    a = session["analyzer"]
    return {"rep_count": a.rep_count, "form_score": a.form_score, "feedback": a.feedback}