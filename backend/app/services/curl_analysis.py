"""
Bicep curl rep counter + basic form guidance.

State machine (elbow angle, shoulder-elbow-wrist):
    EXTENDED -> CURLING -> FLEXED -> LOWERING -> EXTENDED  (+1 rep)
"""
import time
import yaml
from pathlib import Path
from app.services.pose_detection import L, calculate_angle

_cfg = yaml.safe_load((Path(__file__).parent.parent / "core" / "thresholds.yaml").read_text())
T = _cfg["curl"]


class CurlAnalyzer:
    def __init__(self):
        self.state = "EXTENDED"
        self.rep_count = 0
        self.last_rep_time = 0.0
        self.feedback: list[str] = []
        self.feedback_events: list[dict] = []
        self.form_score = T["score_start"]
        self._penalties_applied: set[str] = set()
        self._rep_min_elbow_angle = 180.0
        self._elbow_start_x = None

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

        elbow_angle = calculate_angle(shoulder, elbow, wrist)
        self._rep_min_elbow_angle = min(self._rep_min_elbow_angle, elbow_angle)

        prev = self.state
        if self.state == "EXTENDED":
            if elbow_angle < T["curling_elbow_angle"]:
                self.state = "CURLING"
                self._rep_min_elbow_angle = elbow_angle
                self._elbow_start_x = elbow["x"]
        elif self.state == "CURLING":
            if elbow_angle <= T["flexed_elbow_angle_max"]:
                self.state = "FLEXED"
            elif elbow_angle > T["extended_elbow_angle_min"]:
                self.state = "EXTENDED"
        elif self.state == "FLEXED":
            if elbow_angle > T["lowering_elbow_angle"]:
                self.state = "LOWERING"
        elif self.state == "LOWERING":
            if elbow_angle >= T["extended_elbow_angle_min"]:
                now = time.time() * 1000
                if now - self.last_rep_time >= T["min_rep_time_ms"]:
                    self.rep_count += 1
                    self.last_rep_time = now
                    self._evaluate_rep()
                self.state = "EXTENDED"

        live_feedback: list[str] = []
        if self._elbow_start_x is not None and abs(elbow["x"] - self._elbow_start_x) > T["elbow_drift_tolerance"]:
            live_feedback.append("⚠ Keep your elbow pinned to your side")
            self._add_feedback("elbow_drift", "Keep elbow stationary at your side", T["penalty_elbow_drift"])

        torso_angle = calculate_angle({"x": shoulder["x"], "y": shoulder["y"] - 0.1}, shoulder, hip)
        if torso_angle > T["torso_swing_max_deg"] and self.state in ("CURLING", "FLEXED"):
            live_feedback.append("⚠ Avoid swinging your torso to lift the weight")
            self._add_feedback("swing", "Reduce body swing / momentum", T["penalty_swing"])

        if not live_feedback:
            live_feedback = ["✓ Good form"] if self.state != "EXTENDED" else ["Start with arm extended"]

        status = "good" if all(f.startswith("✓") for f in live_feedback) else "warning"
        if self.state == "EXTENDED" and self.rep_count == 0:
            status = "no_pose_yet" if prev == "EXTENDED" else status

        return {
            "rep_count": self.rep_count, "state": self.state, "form_score": self.form_score,
            "status": status, "feedback": live_feedback, "elbow_angle": round(elbow_angle, 1),
        }

    def _evaluate_rep(self):
        if self._rep_min_elbow_angle > T["good_flex_angle"]:
            self._add_feedback("partial_range", "Curl through a fuller range of motion", T["penalty_partial_range"])

    def summary(self) -> list[dict]:
        events = list(self.feedback_events)
        if self.form_score >= 85:
            events.insert(0, {"text": "Good consistency", "type": "good"})
            events.insert(1, {"text": "Good form", "type": "good"})
        return events[:6]