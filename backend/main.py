from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
from typing import List

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:5173",  # Assuming your frontend runs on this port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

PROMPT_PATH = os.path.join(os.path.dirname(__file__), "prompt.txt")
try:
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        SYSTEM_PROMPT = f.read()
except FileNotFoundError:
    raise RuntimeError("System prompt file 'prompt.txt' not found in backend directory. Please add your prompt.")

class ChatMessage(BaseModel):
    message: str
    chat_id: str | None = None

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

@app.get("/")
async def read_root():
    return {"message": "Hello from new backend!"}

@app.post("/chat/message")
async def chat_message(chat_message: ChatMessage):
    try:
        # Prepend system prompt to user message
        messages = [SYSTEM_PROMPT, chat_message.message]
        response = model.generate_content(messages)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/history")
async def chat_history():
    # This is a placeholder. You would implement actual chat history retrieval here.
    return {"message": "Chat history endpoint - Not yet implemented"}

@app.post("/chat/image")
async def chat_image(
    image: UploadFile = File(...),
    message: str = Form(...)
):
    # Validate file type
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type. Only PNG, JPEG, JPG, and WEBP images are allowed.")
    # Validate file size
    contents = await image.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large. Max size is 5MB.")
    try:
        # Prepend system prompt to multimodal input
        gemini_input = [
            SYSTEM_PROMPT,
            message,
            genai.types.content_types.ImageData(
                mime_type=image.content_type,
                data=contents
            )
        ]
        response = model.generate_content(gemini_input)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))