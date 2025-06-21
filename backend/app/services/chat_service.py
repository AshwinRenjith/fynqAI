from sqlalchemy.orm import Session
from ..db.models import Chat, Message
from ..db.database import SessionLocal

class ChatService:
    def __init__(self, db: Session):
        self.db = db

    def create_chat(self, user_id: int, title: str) -> Chat:
        new_chat = Chat(owner_id=user_id, title=title)
        self.db.add(new_chat)
        self.db.commit()
        self.db.refresh(new_chat)
        return new_chat

    def get_chat(self, chat_id: int) -> Chat:
        return self.db.query(Chat).filter(Chat.id == chat_id).first()

    def get_user_chats(self, user_id: int):
        return self.db.query(Chat).filter(Chat.owner_id == user_id).all()

    def save_message(self, chat_id: int, sender: str, content: str) -> Message:
        new_message = Message(chat_id=chat_id, sender=sender, content=content)
        self.db.add(new_message)
        self.db.commit()
        self.db.refresh(new_message)
        return new_message

    def get_chat_messages(self, chat_id: int):
        return self.db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.timestamp).all()