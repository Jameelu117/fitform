"""
Squat rep counter + basic form guidance.

State machine prevents double-counting:

    STANDING -> DESCENDING -> BOTTOM -> ASCENDING -> STANDING  (+1 rep)

Form guidance is general exercise guidance only — not medical advice.
Thresholds are loaded from core/thresholds.yaml.
"""
import time
import yaml
from pathlib import Path
from app.services.pose_detection import L, calculate_angle

_cfg = yaml.safe_load((Path(__file__).parent.parent / "core" / "thresholds.yaml").read_text())
T = _cfg["squat"]

# How much weight the newest frame gets when smoothing the knee angle.
# Lower = smoother but slower to react; higher = more responsive but noisier.
ANGLE_SMOOTHING_ALPHA = 0.4


class SquatAnalyzer:
    def __init__(self):
        self.state = "STANDING"
        self.rep_count = 0
        self.last_rep_time = 0.0
        self.feedback: list[str] = []
        self.feedback_events: list[dict] = []   # persisted at workout end
        self.form_score = T["score_start"]
        self._penalties_applied: set[str] = set()
        self._rep_min_knee_angle = 180.0
        self._tracked_side: str | None = None      # locked leg — see _select_side
        self._smoothed_knee_angle: float | None = None

    def _select_side(self, landmarks: list[dict]) -> str:
        """Pick which leg to track, and stick with it.

        Recomputing "most visible leg" on every frame lets ordinary visibility
        noise flip the tracked leg mid-rep — since the two legs are rarely at
        the exact same angle, that flip reads as a sudden angle jump and can
        trigger a false rep or interrupt a real one. Instead, lock onto one
        leg and only switch if it becomes genuinely unreliable.
        """
        left_vis = landmarks[L["left_knee"]]["visibility"]
        right_vis = landmarks[L["right_knee"]]["visibility"]

        if self._tracked_side is None:
            self._tracked_side = "left" if left_vis >= right_vis else "right"
            return self._tracked_side

        current_vis = left_vis if self._tracked_side == "left" else right_vis
        other_side = "right" if self._tracked_side == "left" else "left"
        other_vis = right_vis if self._tracked_side == "left" else left_vis

        # Only switch legs if the tracked one has become unreliable AND the
        # other is clearly better — avoids flip-flopping on marginal noise.
        if current_vis < 0.5 and other_vis > current_vis + 0.15:
            self._tracked_side = other_side
        return self._tracked_side

    def _add_feedback(self, key: str, text: str, penalty: int, ftype: str = "warning"):
        if key in self._penalties_applied:
            return
        self._penalties_applied.add(key)
        self.form_score = max(40, self.form_score - penalty)
        self.feedback.append(text)
        self.feedback_events.append({"text": text, "type": ftype})

    def update(self, landmarks: list[dict]) -> dict:
        side = self._select_side(landmarks)

        hip = landmarks[L[f"{side}_hip"]]
        knee = landmarks[L[f"{side}_knee"]]
        ankle = landmarks[L[f"{side}_ankle"]]
        shoulder = landmarks[L[f"{side}_shoulder"]]

        raw_angle = calculate_angle(hip, knee, ankle)
        # Smooth the angle so a single noisy frame can't cross a state
        # threshold on its own — the state machine only sees the trend.
        if self._smoothed_knee_angle is None:
            self._smoothed_knee_angle = raw_angle
        else:
            self._smoothed_knee_angle = (
                ANGLE_SMOOTHING_ALPHA * raw_angle
                + (1 - ANGLE_SMOOTHING_ALPHA) * self._smoothed_knee_angle
            )
        knee_angle = self._smoothed_knee_angle
        self._rep_min_knee_angle = min(self._rep_min_knee_angle, knee_angle)

        # ---------- STATE MACHINE ----------
        prev = self.state
        if self.state == "STANDING":
            if knee_angle < T["descending_knee_angle"]:
                self.state = "DESCENDING"
                self._rep_min_knee_angle = knee_angle
        elif self.state == "DESCENDING":
            if knee_angle <= T["bottom_knee_angle_max"]:
                self.state = "BOTTOM"
            elif knee_angle > T["standing_knee_angle_min"]:
                self.state = "STANDING"   # aborted
        elif self.state == "BOTTOM":
            if knee_angle > T["ascending_knee_angle"]:
                self.state = "ASCENDING"
        elif self.state == "ASCENDING":
            if knee_angle >= T["standing_knee_angle_min"]:
                now = time.time() * 1000
                if now - self.last_rep_time >= T["min_rep_time_ms"]:
                    self.rep_count += 1
                    self.last_rep_time = now
                    self._evaluate_rep()
                self.state = "STANDING"

        # ---------- LIVE FORM CHECKS ----------
        live_feedback: list[str] = []
        knee_offset = abs(knee["x"] - ankle["x"])
        if knee_offset > T["knee_alignment_tolerance"] and self.state in ("DESCENDING", "BOTTOM"):
            live_feedback.append("⚠ Keep your knees aligned over your ankles")
            self._add_feedback("knee_align", "Keep your knees aligned", T["penalty_knee_alignment"])

        torso_angle = calculate_angle(
            {"x": shoulder["x"], "y": shoulder["y"] - 0.1}, shoulder, hip
        )
        if torso_angle > T["torso_lean_max_deg"] and self.state in ("DESCENDING", "BOTTOM"):
            live_feedback.append("⚠ Keep your chest up — avoid leaning too far forward")
            self._add_feedback("torso_lean", "Reduce forward torso lean", T["penalty_torso_lean"])

        if not live_feedback:
            live_feedback = ["✓ Good alignment"] if self.state != "STANDING" else ["Stand in frame to begin"]

        status = "good" if all(f.startswith("✓") for f in live_feedback) else "warning"
        if self.state == "STANDING" and self.rep_count == 0:
            status = "no_pose_yet" if prev == "STANDING" else status

        return {
            "rep_count": self.rep_count,
            "state": self.state,
            "form_score": self.form_score,
            "status": status,
            "feedback": live_feedback,
            "knee_angle": round(knee_angle, 1),
        }

    def _evaluate_rep(self):
        """Per-rep evaluation at rep completion."""
        if self._rep_min_knee_angle > T["good_depth_angle"]:
            self._add_feedback("depth", "Try slightly greater depth", T["penalty_shallow_depth"])

    def summary(self) -> list[dict]:
        events = list(self.feedback_events)
        if self.form_score >= 85:
            events.insert(0, {"text": "Good consistency", "type": "good"})
            events.insert(1, {"text": "Good posture", "type": "good"})
        return events[:6]