from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class MessageCreate(BaseModel):
    """Body the frontend sends when posting a chat message."""
    message_text: str = Field(..., min_length=1, max_length=5000)


class MessageDB(BaseModel):
    id: str
    session_id: str
    sender_uid: str
    receiver_uid: str
    message_text: str
    timestamp: datetime

    class Config:
        from_attributes = True
