
from fastapi import APIRouter, Depends, HTTPException
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi_limiter.depends import RateLimiter
from backend.app.core.security import validate_token
from backend.app.services.gemini_service import GeminiService
from backend.app.services.chat_service import ChatService
from backend.app.db.database import get_db
from backend.app.services.file_service import FileService
import logging

router = APIRouter()

class ChatRequest(BaseModel):
    """Request body for sending a message to Gemini AI."""
    message: str
    chat_id: int | None = None

class ChatResponse(BaseModel):
    """Response body containing Gemini AI's reply and chat ID."""
    response: str
    chat_id: int

class ImageChatResponse(BaseModel):
    """Response body for image-based chat with Gemini AI."""
    response: str
    chat_id: int

class MessageResponse(BaseModel):
    """A single message in a chat history."""
    sender: str
    content: str
    timestamp: datetime

class ChatHistoryResponse(BaseModel):
    """A chat history, including all messages."""
    chat_id: int
    title: str
    created_at: datetime
    messages: list[MessageResponse]

@router.post("/chat/message", response_model=ChatResponse, summary="Send a message to Gemini AI", description="Send a text message to Gemini AI and receive a response. Optionally continue an existing chat by providing chat_id.")
async def chat_with_gemini(request: ChatRequest, current_user_id: str = Depends(validate_token), db: Session = Depends(get_db)):
    """Send a message to Gemini AI and receive a response."""
    try:
        logging.info(f"Received chat request from user {current_user_id}: {request.message[:50]}...")
        
        chat_service = ChatService(db)
        if request.chat_id is None:
            # Create a new chat if no chat_id is provided
            chat = chat_service.create_chat(user_id=int(current_user_id), title=request.message[:50]) # Use first 50 chars as title
            chat_id = chat.id
        else:
            chat_id = request.chat_id
            # Authorization: Verify chat belongs to current_user_id
            chat = chat_service.get_chat(chat_id)
            if not chat or chat.owner_id != int(current_user_id):
                raise HTTPException(status_code=403, detail="Not authorized to access this chat.")

        gemini_service = GeminiService()

        # Save user message
        chat_service.save_message(chat_id=chat_id, sender="user", content=request.message)

        response_text = gemini_service.generate_text(request.message)
        if response_text.startswith("Error:"):
            logging.error(f"Gemini API error: {response_text}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=response_text)
        
        # Save AI response
        chat_service.save_message(chat_id=chat_id, sender="ai", content=response_text)

        logging.info(f"Successfully processed chat request for user {current_user_id}")
        return {"response": response_text, "chat_id": chat_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Unexpected error in chat_with_gemini: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/chat/image", response_model=ImageChatResponse, summary="Send an image and message to Gemini AI", description="Send an image and optional message to Gemini AI for vision-based response. Optionally continue an existing chat by providing chat_id.")
async def chat_with_gemini_image(image: UploadFile = File(...), message: str = Form(...), chat_id: int | None = Form(None), current_user_id: str = Depends(validate_token), db: Session = Depends(get_db)):
    """Send an image and message to Gemini AI for a vision-based response."""
    try:
        # File type and size validation
        allowed_types = {"image/jpeg", "image/png", "image/gif"}
        max_size = 5 * 1024 * 1024  # 5MB
        if image.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and GIF are allowed.")
        image_data = await image.read()
        if len(image_data) > max_size:
            raise HTTPException(status_code=400, detail="File too large. Max size is 5MB.")
        
        chat_service = ChatService(db)
        if chat_id is None:
            # Create a new chat if no chat_id is provided
            chat = chat_service.create_chat(user_id=int(current_user_id), title=message[:50] if message else "Image Chat")
            chat_id = chat.id
        else:
            # Authorization: Verify chat belongs to current_user_id
            chat = chat_service.get_chat(chat_id)
            if not chat or chat.owner_id != int(current_user_id):
                raise HTTPException(status_code=403, detail="Not authorized to access this chat.")

        gemini_service = GeminiService()
        
        # Save user message (including image reference if applicable)
        chat_service.save_message(chat_id=chat_id, sender="user", content=f"[Image] {message}")

        response_text = gemini_service.generate_text_with_image(message, image_data)
        if response_text.startswith("Error:"):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=response_text)
        
        # Save AI response
        chat_service.save_message(chat_id=chat_id, sender="ai", content=response_text)

        return {"response": response_text, "chat_id": chat_id}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in chat_with_gemini_image: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not process image and message: {e}")

@router.get("/chat/history", response_model=list[ChatHistoryResponse], summary="Get chat history", description="Retrieve the chat history for the current user, including all messages in each chat.")
async def get_chat_history(current_user_id: str = Depends(validate_token), db: Session = Depends(get_db)):
    """Get the chat history for the current user."""
    try:
        chat_service = ChatService(db)
        chats = chat_service.get_user_chats(user_id=int(current_user_id))
        
        chat_history = []
        for chat in chats:
            messages = chat_service.get_chat_messages(chat.id)
            chat_history.append({
                "chat_id": chat.id,
                "title": chat.title,
                "created_at": chat.created_at,
                "messages": [{
                    "sender": msg.sender,
                    "content": msg.content,
                    "timestamp": msg.timestamp
                } for msg in messages]
            })
        return chat_history
    except Exception as e:
        logging.error(f"Error in get_chat_history: {e}")
        raise HTTPException(status_code=500, detail=f"Could not retrieve chat history: {str(e)}")
