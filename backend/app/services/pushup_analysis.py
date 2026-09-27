"""
Push-up rep counter + basic form guidance.

State machine (elbow angle, shoulder-elbow-wrist):
    UP -> DESCENDING -> BOTTOM -> ASCENDING -> UP  (+1 rep)

Body-line (shoulder-hip-ankle angle) catches sagging or piking hips.
"""
import time
import yaml
from pathlib import Path
from app.services.pose_detection import L, calculate_angle

_cfg = yaml.safe_load((Path(__file__).parent.parent / "core" / "thresholds.yaml").read_text())
T = _cfg["pushup"]


class PushupAnalyzer:
    def __init__(self):
        self.state = "UP"
        self.rep_count = 0
        self.last_rep_time = 0.0
        self.feedback: list[str] = []
        self.feedback_events: list[dict] = []
        self.form_score = T["score_start"]
        self._penalties_applied: set[str] = set()
        self._rep_min_elbow_angle = 180.0

    def _add_feedback(self, key, text, penalty, ftype="warning"):
        if key in self._penalties_applied:
            return
        self._penalties_applied.add(key)
        self.form_score = max(40, self.form_score - penalty)
        self.feedback.append(text)
        self.feedback_events.append({"text": text, "type": ftype})

    def update(self, landmarks: list[dict]) -> dict:
        left_vis = landmarks[L["left_elbow"]]["visibility"]
        right_vis = landmarks[L["right_elbow"]]["visibility"]
        side = "left" if left_vis >= right_vis else "right"

        shoulder = landmarks[L[f"{side}_shoulder"]]
        elbow = landmarks[L[f"{side}_elbow"]]
        wrist = landmarks[L[f"{side}_wrist"]]
        hip = landmarks[L[f"{side}_hip"]]
        ankle = landmarks[L[f"{side}_ankle"]]

        elbow_angle = calculate_angle(shoulder, elbow, wrist)
        self._rep_min_elbow_angle = min(self._rep_min_elbow_angle, elbow_angle)

        prev = self.state
        if self.state == "UP":
            if elbow_angle < T["descending_elbow_angle"]:
                self.state = "DESCENDING"
                self._rep_min_elbow_angle = elbow_angle
        elif self.state == "DESCENDING":
            if elbow_angle <= T["bottom_elbow_angle_max"]:
                self.state = "BOTTOM"
            elif elbow_angle > T["top_elbow_angle_min"]:
                self.state = "UP"
        elif self.state == "BOTTOM":
            if elbow_angle > T["ascending_elbow_angle"]:
                self.state = "ASCENDING"
        elif self.state == "ASCENDING":
            if elbow_angle >= T["top_elbow_angle_min"]:
                now = time.time() * 1000
                if now - self.last_rep_time >= T["min_rep_time_ms"]:
                    self.rep_count += 1
                    self.last_rep_time = now
                    self._evaluate_rep()
                self.state = "UP"

        live_feedback: list[str] = []
        body_line_angle = calculate_angle(shoulder, hip, ankle)
        if abs(180 - body_line_angle) > T["hip_sag_tolerance_deg"] and self.state in ("DESCENDING", "BOTTOM", "ASCENDING"):
            live_feedback.append("⚠ Keep your body in a straight line — avoid sagging or piking hips")
            self._add_feedback("hip_sag", "Keep hips level with shoulders and ankles", T["penalty_hip_sag"])

        if not live_feedback:
            live_feedback = ["✓ Good alignment"] if self.state != "UP" else ["Get into plank position to begin"]

        status = "good" if all(f.startswith("✓") for f in live_feedback) else "warning"
        if self.state == "UP" and self.rep_count == 0:
            status = "no_pose_yet" if prev == "UP" else status

        return {
            "rep_count": self.rep_count, "state": self.state, "form_score": self.form_score,
            "status": status, "feedback": live_feedback, "elbow_angle": round(elbow_angle, 1),
        }

    def _evaluate_rep(self):
        if self._rep_min_elbow_angle > T["good_depth_angle"]:
            self._add_feedback("depth", "Lower a bit further for full range of motion", T["penalty_shallow_depth"])

    def summary(self) -> list[dict]:
        events = list(self.feedback_events)
        if self.form_score >= 85:
            events.insert(0, {"text": "Good consistency", "type": "good"})
            events.insert(1, {"text": "Good posture", "type": "good"})
        return events[:6]