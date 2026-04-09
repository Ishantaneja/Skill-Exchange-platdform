from pydantic import BaseModel
from typing import Literal


class SkillRequestCreate(BaseModel):
    # from_user_id is inferred from auth token; callers should not send it
    to_user_id: str
    skill_offered: str
    skill_requested: str


class SkillRequestDB(SkillRequestCreate):
    id: str
    from_user_id: str = ""
    status: Literal["pending", "accepted", "rejected"] = "pending"

    class Config:
        from_attributes = True
