import os
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError
from typing import Optional
from dotenv import load_dotenv
from pathlib import Path
import shutil

load_dotenv()

app = FastAPI()

# Only allow trusted frontend origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")  # You must set this in your .env
SUPABASE_JWT_AUDIENCE = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")
if not SUPABASE_JWT_SECRET:
    raise ValueError(
        "SUPABASE_JWT_SECRET not found in .env file (get it from your Supabase project settings)"
    )

import google.generativeai as genai

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


class ChatMessage(BaseModel):
    message: str
    chat_id: Optional[str] = None


# --- JWT Auth ---
class User(BaseModel):
    id: str
    email: str
    role: Optional[str] = None
    # Add more fields as needed


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience=SUPABASE_JWT_AUDIENCE,
        )
        user_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role")
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
            )
        return User(id=user_id, email=email, role=role)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        ) from e


@app.get("/", tags=["Health"])
async def read_root():
    """Health check endpoint."""
    return {"message": "Hello from secure backend!"}


@app.post("/chat/message", tags=["Chat"])
async def chat_message(
    chat_message: ChatMessage, user: User = Depends(get_current_user)
):
    """
    Send a chat message to Gemini. Requires authentication.
    Associates the message with the authenticated user.
    """
    if not chat_message.message or len(chat_message.message.strip()) < 1:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    try:
        response = model.generate_content(chat_message.message)
        return {"response": response.text, "user_id": user.id, "email": user.email}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/image", tags=["Chat"])
async def chat_image(
    image: UploadFile = File(...),
    message: str = Form(""),
    chat_id: Optional[str] = Form(None),
    user: User = Depends(get_current_user),
):
    """
    Upload an image and an optional message to Gemini. Requires authentication.
    Associates the upload with the authenticated user.
    """
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")
    # Save file
    file_path = UPLOAD_DIR / f"{user.id}_{image.filename}"
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    # Here you could process the image with Gemini if needed
    return {
        "message": message,
        "filename": image.filename,
        "user_id": user.id,
        "email": user.email,
    }


@app.post("/files/upload", tags=["Files"])
async def upload_file(
    file: UploadFile = File(...), user: User = Depends(get_current_user)
):
    """
    Upload a file. Requires authentication.
    Associates the upload with the authenticated user.
    """
    # Limit file size, type, etc. as needed
    file_path = UPLOAD_DIR / f"{user.id}_{file.filename}"
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "user_id": user.id, "email": user.email}


@app.get("/chat/history", tags=["Chat"])
async def chat_history(user: User = Depends(get_current_user)):
    """
    Placeholder for chat history. Should return chat history for the authenticated user.
    """
    return {
        "message": "Chat history endpoint - Not yet implemented",
        "user_id": user.id,
        "email": user.email,
    }


@app.get("/users/me", tags=["Users"])
async def get_me(user: User = Depends(get_current_user)):
    """
    Return the authenticated user's info.
    """
    return user
