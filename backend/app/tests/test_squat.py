from app.services.squat_analysis import SquatAnalyzer
from app.services.pose_detection import L

def make_landmarks(knee_angle_deg: float):
    """Fabricate 33 landmarks with a synthetic knee angle (via knee position)."""
    import math
    lm = [{"x": 0.5, "y": 0.5, "z": 0, "visibility": 0.99} for _ in range(33)]
    lm[L["left_hip"]] = {"x": 0.5, "y": 0.4, "z": 0, "visibility": 0.99}
    # thigh goes straight down; shank angle controls knee angle
    knee = {"x": 0.5, "y": 0.6, "z": 0, "visibility": 0.99}
    theta = math.radians(180 - knee_angle_deg)
    ankle = {"x": 0.5 + 0.2 * math.sin(theta), "y": 0.6 + 0.2 * math.cos(theta),
             "z": 0, "visibility": 0.99}
    lm[L["left_knee"]] = knee
    lm[L["left_ankle"]] = ankle
    lm[L["left_shoulder"]] = {"x": 0.5, "y": 0.2, "z": 0, "visibility": 0.99}
    return lm

def test_rep_counting():
    a = SquatAnalyzer()
    a.last_rep_time = -1e9
    # standing -> down -> bottom -> up -> standing
    for angle in [170, 140, 100, 140, 170]:
        a.update(make_landmarks(angle))
    assert a.rep_count == 1

def test_no_double_count_at_bottom():
    a = SquatAnalyzer()
    a.last_rep_time = -1e9
    for angle in [170, 140, 100, 100, 100, 140, 170]:
        a.update(make_landmarks(angle))
    assert a.rep_count == 1
