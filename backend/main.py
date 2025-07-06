from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:5173",  # Assuming your frontend runs on this port
    "http://127.0.0.1:5173",
    "http://localhost:8080",  # Add this for your current frontend port
    "http://127.0.0.1:8080",  # Add this for your current frontend port
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
model = genai.GenerativeModel('gemini-2.5-flash')

class ChatMessage(BaseModel):
    message: str
    chat_id: str | None = None

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Dummy verification for now; replace with real JWT verification
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=403, detail="Not authenticated")
    # Optionally, decode and validate the JWT here
    return token

@app.get("/")
async def read_root():
    return {"message": "Hello from new backend!"}

@app.post("/api/v1/chat/message")
async def chat_message(chat_message: ChatMessage, token: str = Depends(verify_token)):
    try:
        response = model.generate_content(chat_message.message)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/chat/image")
async def chat_image(
    image: UploadFile = File(...),
    message: str = Form(...),
    chat_id: str = Form(None),
    token: str = Depends(verify_token)
):
    # For now, just echo back the message and filename
    # You can add image processing/AI logic here
    return {"response": f"Received image {image.filename} with message: {message}"}

@app.get("/api/v1/chat/history")
async def chat_history():
    # This is a placeholder. You would implement actual chat history retrieval here.
    return {"message": "Chat history endpoint - Not yet implemented"}