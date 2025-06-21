from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db.database import get_db
from datetime import datetime
from pydantic import BaseModel
from ..db.models import User
from ..core.security import validate_token

router = APIRouter()

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user_id: str = Depends(validate_token), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Note: User registration and login will primarily be handled by Supabase client-side.
# These endpoints are for demonstration or specific backend-driven flows if needed.
# For typical Supabase auth, the client SDK handles sign-up/sign-in and token management.

@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def register_user():
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Registration handled by Supabase client SDK")

@router.post("/auth/login")
async def login_user():
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Login handled by Supabase client SDK")