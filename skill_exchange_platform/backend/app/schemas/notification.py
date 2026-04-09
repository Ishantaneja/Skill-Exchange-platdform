from pydantic import BaseModel
from typing import Literal


class NotificationCreate(BaseModel):
    user_id: str
    type: Literal["request", "status", "session"]
    message: str
    related_id: str  # could be request/session id


class NotificationDB(NotificationCreate):
    id: str
    read: bool = False

    class Config:
        from_attributes = True
