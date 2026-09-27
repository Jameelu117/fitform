from app.core.database import SessionLocal, Base, engine
from app.models.models import Exercise

EXERCISES = [
    dict(name="Squats", difficulty="Beginner", target_muscles="Quads, Glutes, Hamstrings",
         category="lower body", recommended_reps=12, image="squat",
         description="A fundamental lower-body movement. AI analysis available with camera.",
         instructions="1. Stand with feet shoulder-width apart.\n2. Keep chest up and core tight.\n3. Push hips back and bend knees to lower.\n4. Descend until thighs are near parallel.\n5. Drive through heels to stand.",
         form_tips="Keep knees tracking over toes.\nMaintain a neutral spine.\nKeep heels on the floor.",
         common_mistakes="Knees caving inward.\nHeels lifting off the floor.\nExcessive forward lean."),
    dict(name="Push-ups", difficulty="Intermediate", target_muscles="Chest, Triceps, Shoulders",
         category="upper body", recommended_reps=10, image="pushup",
         description="Classic upper-body pressing movement. Tracked mode with rep logging.",
         instructions="1. Start in a high plank, hands under shoulders.\n2. Lower chest toward the floor.\n3. Keep elbows ~45° from your body.\n4. Push back up to full extension.",
         form_tips="Keep body in a straight line.\nEngage your core throughout.",
         common_mistakes="Sagging hips.\nFlaring elbows wide.\nPartial range of motion."),
    dict(name="Lunges", difficulty="Intermediate", target_muscles="Quads, Glutes",
         category="lower body", recommended_reps=10, image="lunge",
         description="Unilateral leg exercise for balance and strength.",
         instructions="1. Step forward with one leg.\n2. Lower until both knees are ~90°.\n3. Push through the front heel to return.\n4. Alternate legs.",
         form_tips="Keep torso upright.\nFront knee over ankle.",
         common_mistakes="Knee extending past toes excessively.\nLeaning forward."),
    dict(name="Bicep Curls", difficulty="Beginner", target_muscles="Biceps",
         category="upper body", recommended_reps=12, image="curl",
         description="Isolation exercise for the arms using dumbbells or bands.",
         instructions="1. Stand tall, weights at your sides.\n2. Curl weights up, keeping elbows still.\n3. Lower with control.",
         form_tips="Avoid swinging.\nFull range of motion.",
         common_mistakes="Using momentum.\nElbows drifting forward."),
    dict(name="Jumping Jacks", difficulty="Beginner", target_muscles="Full Body, Cardio",
         category="cardio", recommended_reps=30, image="jacks",
         description="Cardio warm-up movement to elevate heart rate.",
         instructions="1. Stand with feet together, arms at sides.\n2. Jump, spreading legs and raising arms overhead.\n3. Jump back to start.",
         form_tips="Land softly.\nKeep a steady rhythm.",
         common_mistakes="Landing with locked knees."),
]

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if db.query(Exercise).count() == 0:
        for e in EXERCISES:
            db.add(Exercise(**e))
        db.commit()
        print("Seeded", len(EXERCISES), "exercises")
    db.close()