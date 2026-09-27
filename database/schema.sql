CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    fitness_goal VARCHAR(120) DEFAULT 'General fitness',
    preferred_workout VARCHAR(120) DEFAULT 'Strength',
    profile_image TEXT
);

CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    difficulty VARCHAR(40),
    target_muscles VARCHAR(255),
    instructions TEXT,
    form_tips TEXT,
    common_mistakes TEXT,
    recommended_reps INTEGER DEFAULT 12,
    category VARCHAR(60) DEFAULT 'strength',
    image VARCHAR(255) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS workouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    duration INTEGER,
    reps INTEGER,
    form_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_feedback (
    id SERIAL PRIMARY KEY,
    workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
    feedback_text TEXT,
    feedback_type VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    workout_date DATE,
    reps INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    form_score FLOAT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_workouts_user ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_date ON progress(user_id, workou