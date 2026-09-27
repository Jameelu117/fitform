# FitForm AI

**Move Better. Train Smarter.**

AI-powered workout tracking and exercise-form guidance using camera-based pose estimation.

> ⚠️ FitForm AI provides general exercise guidance only — not medical advice, diagnosis, or injury prevention.

## Features

- 📷 Real-time pose estimation (MediaPipe, server-side Python) with skeleton overlay
- 🔢 Automatic squat rep counting via a movement state machine (no double counts)
- 📊 Form scoring with configurable thresholds (YAML) and live feedback
- 🏋️ Exercise library with search & filters (Squats, Push-ups, Lunges, Curls, Jumping Jacks)
- 📈 Progress dashboard: streaks, weekly charts, per-exercise performance
- 🔐 JWT authentication, protected routes
- 🧪 Demo Mode — full experience simulated, clearly labeled, no camera needed
- 🌑 Dark glassmorphism UI, Framer Motion animations, fully responsive

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide |
| Backend | Python, FastAPI, SQLAlchemy |
| AI/CV | MediaPipe Pose, OpenCV, NumPy, scikit-learn |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (bcrypt hashed passwords) — swappable for Supabase Auth |
| Deploy | Vercel (frontend), Render (backend) |

## How the AI works

1. The browser captures webcam frames (~4.5 fps) and JPEG-encodes them.
2. Frames are POSTed to `/api/analyze-frame` as base64.
3. Python runs MediaPipe Pose → 33 body landmarks.
4. For squats, knee joint angles (hip–knee–ankle) are computed with NumPy.
5. A state machine (`STANDING → DESCENDING → BOTTOM → ASCENDING → STANDING`)
   counts exactly one rep per full cycle, with a debounce timer.
6. Form checks (knee alignment, torso lean, depth) apply penalties from
   `app/core/thresholds.yaml` — tune without touching code.
7. Frames are processed in memory and never stored.

## Run locally

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # fill in DATABASE_URL + JWT_SECRET
python seed.py
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
# http://localhost:5173
```

### Tests
```bash
cd backend && pytest
```

## Supabase setup

1. Create a project at supabase.com → Settings → Database → copy the connection string.
2. Set it as `DATABASE_URL`. Tables are auto-created by SQLAlchemy,
   or run `database/schema.sql` manually in the SQL editor.
3. (Optional) Swap the built-in JWT auth for Supabase Auth by validating
   Supabase-issued tokens in `app/api/deps.py`.

## API summary

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` `/api/auth/login` | Auth (JWT) |
| POST | `/api/workout/start` | Create AI session |
| POST | `/api/analyze-frame` | Analyze a camera frame |
| POST | `/api/workout/end` | Finalize session + summary |
| GET | `/api/workouts/exercises[/{id}]` | Exercise library |
| POST/GET | `/api/workouts[/{id}]` | Save / list / detail workouts |
| GET | `/api/progress` | Aggregated stats |
| GET/PUT | `/api/profile` | Profile |

Example `/api/analyze-frame` response:
```json
{
  "exercise": "squat", "rep_count": 8, "state": "ASCENDING",
  "form_score": 92, "status": "good", "pose_detected": true,
  "feedback": ["✓ Good alignment"], "landmarks": [...]
}
```

## Deployment

**Backend (Render):** New Web Service → connect repo → root `backend/` →
build `pip install -r requirements.txt` → start
`uvicorn app.main:app --host 0.0.0.0 --port $PORT` → set env vars.

**Frontend (Vercel):** Import repo → root `frontend/` → set
`VITE_API_URL=https://your-api.onrender.com` → deploy. Add your Vercel URL to
backend `CORS_ORIGINS` and redeploy.

## Future improvements

- Client-side MediaPipe (WASM) to eliminate per-frame network round-trips
- Form analysis for push-ups & lunges (new analyzers + threshold profiles)
- WebSocket streaming for lower-latency feedback
- Social features, workout plans, wearable integrations