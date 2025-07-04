
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Updated CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ca2a13fc-2220-407c-a4d6-272038e2ac18.lovableproject.com",  # Your current Lovable preview URL
    "https://*.lovableproject.com",  # Allow all Lovable preview URLs
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in .env file")
    GEMINI_API_KEY = "dummy_key"  # Fallback for development

try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
except Exception as e:
    print(f"Warning: Could not configure Gemini AI: {e}")
    model = None

class ChatMessage(BaseModel):
    message: str
    chat_id: str | None = None

@app.get("/")
async def read_root():
    return {"message": "FastAPI backend is running!", "status": "online"}

@app.post("/api/v1/chat/message")
async def chat_message(chat_message: ChatMessage):
    try:
        if model is None:
            # Fallback response when Gemini is not available
            return {
                "response": "I'm here to help with your studies! However, I'm currently running in offline mode. Please ensure your Gemini API key is properly configured in your backend .env file for full AI functionality.",
                "status": "offline_mode"
            }
        
        response = model.generate_content(chat_message.message)
        return {"response": response.text, "status": "success"}
    except Exception as e:
        print(f"Gemini API error: {e}")
        # Fallback educational response
        fallback_response = f"I understand you're asking about '{chat_message.message[:50]}...'. While I'm experiencing some technical difficulties with my AI processing, I'm still here to help! Could you please rephrase your question or try asking about a specific topic you'd like to learn about?"
        return {"response": fallback_response, "status": "fallback"}

@app.get("/api/v1/chat/history")
async def chat_history():
    return {"message": "Chat history endpoint", "data": []}

@app.get("/api/v1/users/me")
async def get_current_user():
    return {"message": "User endpoint", "user": "current_user"}
