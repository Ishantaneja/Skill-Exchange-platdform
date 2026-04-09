from typing import List, Optional
from pydantic import BaseModel


class UserProfileBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    skills_offered: Optional[List[str]] = []
    skills_wanted: Optional[List[str]] = []
    availability: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    skills_offered: Optional[List[str]] = None
    skills_wanted: Optional[List[str]] = None
    availability: Optional[str] = None


class UserProfileDB(UserProfileBase):
    id: str
    reputation: float = 0.0
    total_ratings: int = 0

    class Config:
        from_attributes = True
