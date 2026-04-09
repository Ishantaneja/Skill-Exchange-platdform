from pydantic import BaseModel, Field
from typing import Optional


class RatingCreate(BaseModel):
    session_id: str
    ratee_id: str
    score: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = None


class RatingDB(RatingCreate):
    id: str
    rater_id: str = ""

    class Config:
        from_attributes = True
