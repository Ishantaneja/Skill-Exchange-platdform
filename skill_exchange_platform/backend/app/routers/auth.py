from fastapi import APIRouter, Depends, HTTPException
from app.services.firebase import verify_token
from app.services import db as db_module
from app.schemas.user import UserProfileDB

router = APIRouter()

@router.post("/login/", response_model=UserProfileDB)
async def login_user(user_data: dict = Depends(verify_token)):
    # user_data contains uid, email, name, etc. from Firebase
    uid = user_data.get("uid")
    email = user_data.get("email")
    name = user_data.get("name") or ""

    existing = await db_module.db.users.find_one({"_id": uid})
    if existing:
        existing["id"] = str(existing["_id"])
        return existing

    # create profile if new
    profile = {
        "_id": uid,
        "name": name,
        "email": email,
        "skills_offered": [],
        "skills_wanted": [],
        "availability": None,
        "reputation": 0.0,
    }
    await db_module.db.users.insert_one(profile)
    profile["id"] = str(uid)
    return profile
