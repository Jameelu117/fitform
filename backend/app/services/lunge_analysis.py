"""
Lunge rep counter + basic form guidance.

Auto-selects the "front" (currently more bent) leg each frame.
State machine:
    STANDING -> DESCENDING -> BOTTOM -> ASCENDING -> STANDING  (+1 rep)
"""
import time
import yaml
from pathlib import Path
from app.services.pose_detection import L, calculate_angle

_cfg = yaml.safe_load((Path(__file__).parent.parent / "core" / "thresholds.yaml").read_text())
T = _cfg["lunge"]


class LungeAnalyzer:
    def __init__(self):
        self.state = "STANDING"
        self.rep_count = 0
        self.last_rep_time = 0.0
        self.feedback: list[str] = []
        self.feedback_events: list[dict] = []
        self.form_score = T["score_start"]
        self._penalties_applied: set[str] = set()
        self._rep_min_knee_angle = 180.0

    def _add_feedback(self, key, text, penalty, ftype="warning"):
        if key in self._penalties_applied:
            return
        self._penalties_applied.add(key)
        self.form_score = max(40, self.form_score - penalty)
        self.feedback.append(text)
        self.feedback_events.append({"text": text, "type": ftype})

    def update(self, landmarks: list[dict]) -> dict:
        left_knee_angle = calculate_angle(landmarks[L["left_hip"]], landmarks[L["left_knee"]], landmarks[L["left_ankle"]])
        right_knee_angle = calculate_angle(landmarks[L["right_hip"]], landmarks[L["right_knee"]], landmarks[L["right_ankle"]])
        side = "left" if left_knee_angle <= right_knee_angle else "right"

        hip = landmarks[L[f"{side}_hip"]]
        knee = landmarks[L[f"{side}_knee"]]
        ankle = landmarks[L[f"{side}_ankle"]]
        shoulder = landmarks[L[f"{side}_shoulder"]]
        knee_angle = left_knee_angle if side == "left" else right_knee_angle
        self._rep_min_knee_angle = min(self._rep_min_knee_angle, knee_angle)

        prev = self.state
        if self.state == "STANDING":
            if knee_angle < T["descending_knee_angle"]:
                self.state = "DESCENDING"
                self._rep_min_knee_angle = knee_angle
        elif self.state == "DESCENDING":
            if knee_angle <= T["bottom_knee_angle_max"]:
                self.state = "BOTTOM"
            elif knee_angle > T["standing_knee_angle_min"]:
                self.state = "STANDING"
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

        live_feedback: list[str] = []
        if abs(knee["x"] - ankle["x"]) > T["knee_over_toe_tolerance"] and self.state in ("DESCENDING", "BOTTOM"):
            live_feedback.append("⚠ Keep your front knee tracking over your ankle, not past your toes")
            self._add_feedback("knee_over_toe", "Keep front knee over ankle", T["penalty_knee_over_toe"])

        torso_angle = calculate_angle({"x": shoulder["x"], "y": shoulder["y"] - 0.1}, shoulder, hip)
        if torso_angle > T["torso_lean_max_deg"] and self.state in ("DESCENDING", "BOTTOM"):
            live_feedback.append("⚠ Keep your torso upright")
            self._add_feedback("torso_lean", "Reduce forward torso lean", T["penalty_torso_lean"])

        if not live_feedback:
            live_feedback = ["✓ Good alignment"] if self.state != "STANDING" else ["Stand in frame to begin"]

        status = "good" if all(f.startswith("✓") for f in live_feedback) else "warning"
        if self.state == "STANDING" and self.rep_count == 0:
            status = "no_pose_yet" if prev == "STANDING" else status

        return {
            "rep_count": self.rep_count, "state": self.state, "form_score": self.form_score,
            "status": status, "feedback": live_feedback, "knee_angle": round(knee_angle, 1),
        }

    def _evaluate_rep(self):
        if self._rep_min_knee_angle > T["good_depth_angle"]:
            self._add_feedback("depth", "Lower until both knees reach about 90°", T["penalty_shallow_depth"])

    def summary(self) -> list[dict]:
        events = list(self.feedback_events)
        if self.form_score >= 85:
            events.insert(0, {"text": "Good consistency", "type": "good"})
            events.insert(1, {"text": "Good posture", "type": "good"})
        return events[:6]