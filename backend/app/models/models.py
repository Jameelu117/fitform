from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    profile = relationship("Profile", back_populates="user", uselist=False)
    workouts = relationship("Workout", back_populates="user")

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    fitness_goal = Column(String(120), default="General fitness")
    preferred_workout = Column(String(120), default="Strength")
    profile_image = Column(Text, nullable=True)
    user = relationship("User", back_populates="profile")

class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    description = Column(Text)
    difficulty = Column(String(40))
    target_muscles = Column(String(255))
    instructions = Column(Text)
    form_tips = Column(Text)
    common_mistakes = Column(Text)
    recommended_reps = Column(Integer, default=12)
    category = Column(String(60), default="strength")
    image = Column(String(255), default="")

class Workout(Base):
    __tablename__ = "workouts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    duration = Column(Integer)          # seconds
    reps = Column(Integer)
    form_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="workouts")
    exercise = relationship("Exercise")
    feedback = relationship("FormFeedback", back_populates="workout", cascade="all, delete-orphan")

class FormFeedback(Base):
    __tablename__ = "form_feedback"
    id = Column(Integer, primary_key=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    feedback_text = Column(Text)
    feedback_type = Column(String(20))  # good | warning | info
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    workout = relationship("Workout", back_populates="feedback")

class Progress(Base):
    __tablename__ = "progress"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    workout_date = Column(Date)
    reps = Column(Integer, default=0)
    duration = Column(Integer, default=0)
    form_score = Column(Float, default=0)
