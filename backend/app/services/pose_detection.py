"""MediaPipe Pose wrapper — extracts body landmarks from JPEG frames."""
import base64
import cv2
import numpy as np
import mediapipe as mp

class PoseDetector:
    def __init__(self):
        self.pose = mp.solutions.pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6,
        )

    @staticmethod
    def decode_image(image_base64: str) -> np.ndarray | None:
        """Accepts raw base64 or data URL; returns BGR image."""
        try:
            if "," in image_base64:
                image_base64 = image_base64.split(",", 1)[1]
            buf = base64.b64decode(image_base64)
            arr = np.frombuffer(buf, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            return img
        except Exception:
            return None

    def detect(self, image_bgr: np.ndarray) -> list[dict] | None:
        """Returns list of 33 landmarks [{x, y, z, visibility}] or None."""
        rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        result = self.pose.process(rgb)
        if not result.pose_landmarks:
            return None
        return [
            {"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility}
            for lm in result.pose_landmarks.landmark
        ]

# Landmark indices (MediaPipe Pose)
L = {
    "left_shoulder": 11, "right_shoulder": 12,
    "left_hip": 23, "right_hip": 24,
    "left_knee": 25, "right_knee": 26,
    "left_ankle": 27, "right_ankle": 28,
}

def calculate_angle(a: dict, b: dict, c: dict) -> float:
    """Angle at point b formed by a-b-c, in degrees."""
    a_v = np.array([a["x"], a["y"]])
    b_v = np.array([b["x"], b["y"]])
    c_v = np.array([c["x"], c["y"]])
    ba, bc = a_v - b_v, c_v - b_v
    cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
    return float(np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0))))
# Landmark indices (MediaPipe Pose)
L = {
    "left_shoulder": 11, "right_shoulder": 12,
    "left_elbow": 13, "right_elbow": 14,
    "left_wrist": 15, "right_wrist": 16,
    "left_hip": 23, "right_hip": 24,
    "left_knee": 25, "right_knee": 26,
    "left_ankle": 27, "right_ankle": 28,
}
