from pydantic import BaseModel, Field
from typing import Optional


class Skill(BaseModel):
    name: str = Field(..., example="Python Programming")
    description: Optional[str] = None


class SkillDB(Skill):        
    id: str
    owner_id: str

    class Config:
        from_attributes = True
