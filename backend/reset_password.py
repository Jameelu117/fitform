# backend/reset_password.py
# One-off helper to reset a user's password directly in the database.
# Run this from inside the backend/ folder, with your venv activated:
#     python reset_password.py

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.models import User

EMAIL = "jameelunnisa1114@gmail.com"   # the account you're trying to log into
NEW_PASSWORD = "Training123"           # pick any password (6+ characters), then use it to log in

db = SessionLocal()
user = db.query(User).filter(User.email == EMAIL).first()

if not user:
    print(f"No account found with email: {EMAIL}")
else:
    user.password_hash = hash_password(NEW_PASSWORD)
    db.commit()
    print(f"Password for {EMAIL} has been reset to: {NEW_PASSWORD}")

db.close()
