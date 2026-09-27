"""
Jumping jack rep counter + basic form guidance.

Tracked via a combined "openness" signal rather than a single joint
angle: ankle spread (normalized by hip width) and whether wrists are
raised above shoulder height.

State machine:
    CLOSED -> OPEN -> CLOSED  (+1 rep per full cycle)
"""
import time
import yaml
from pathlib import Path
from app.services.pose_detection import L

_cfg = yaml.safe_load((Path(__file__).parent.parent / "core" / "thresholds.yaml").read_text())
T = _cfg["jumping_jack"]


def _hip_width(landmarks):
    lh, rh = landmarks[L["left_hip"]], landmarks[L["right_hip"]]
    return max(abs(lh["x"] - rh["x"]), 1e-3)


class JumpingJackAnalyzer:
    def __init__(self):
        self.state = "CLOSED"
        self.rep_count = 0
        self.last_rep_time = 0.0
        self.feedback: list[str] = []
        self.feedback_events: list[dict] = []
        self.form_score = T["score_start"]
        self._penalties_applied: set[str] = set()

    def _add_feedback(self, key, text, penalty, ftype="warning"):
        if key in self._penalties_applied:
            return
        self._penalties_applied.add(key)
        self.form_score = max(40, self.form_score - penalty)
        self.feedback.append(text)
        self.feedback_events.append({"text": text, "type": ftype})

    def update(self, landmarks: list[dict]) -> dict:
        l_ankle, r_ankle = landmarks[L["left_ankle"]], landmarks[L["right_ankle"]]
        l_wrist, r_wrist = landmarks[L["left_wrist"]], landmarks[L["right_wrist"]]
        l_shoulder, r_shoulder = landmarks[L["left_shoulder"]], landmarks[L["right_shoulder"]]

        ankle_spread = abs(l_ankle["x"] - r_ankle["x"]) / _hip_width(landmarks)
        arms_raised = (l_wrist["y"] < l_shoulder["y"]) and (r_wrist["y"] < r_shoulder["y"])
        legs_apart = ankle_spread > T["open_spread_min"]
        legs_together = ankle_spread < T["closed_spread_max"]

        prev = self.state
        if self.state == "CLOSED":
            if legs_apart and arms_raised:
                self.state = "OPEN"
        elif self.state == "OPEN":
            if legs_together and not arms_raised:
                now = time.time() * 1000
                if now - self.last_rep_time >= T["min_rep_time_ms"]:
                    self.rep_count += 1
                    self.last_rep_time = now
                self.state = "CLOSED"

        live_feedback: list[str] = []
        if self.state == "OPEN" and legs_apart != arms_raised:
            live_feedback.append("⚠ Sync your arms and legs — raise arms overhead as you jump feet apart")
            self._add_feedback("async", "Sync arm raise with leg spread", T["penalty_async"])

        if not live_feedback:
            live_feedback = ["✓ Good rhythm"] if self.rep_count > 0 else ["Stand in frame to begin"]

        status = "good" if all(f.startswith("✓") for f in live_feedback) else "warning"
        if self.state == "CLOSED" and self.rep_count == 0:
            status = "no_pose_yet" if prev == "CLOSED" else status

        return {
            "rep_count": self.rep_count, "state": self.state, "form_score": self.form_score,
            "status": status, "feedback": live_feedback, "ankle_spread": round(ankle_spread, 2),
        }

    def summary(self) -> list[dict]:
        events = list(self.feedback_events)
        if self.form_score >= 85:
            events.insert(0, {"text": "Good consistency", "type": "good"})
            events.insert(1, {"text": "Good rhythm", "type": "good"})
        return events[:6]