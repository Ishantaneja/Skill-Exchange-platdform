from pydantic import BaseModel
from typing import Literal


class SessionCreate(BaseModel):
    request_id: str


class SessionDB(BaseModel):
    id: str
    user_a_id: str
    user_b_id: str
    skill_a: str
    skill_b: str
    status: Literal["active", "completed"] = "active"

    class Config:
        from_attributes = True
