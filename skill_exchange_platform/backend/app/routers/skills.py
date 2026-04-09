from fastapi import APIRouter, Depends, HTTPException, Query
from app.services.firebase import verify_token
from app.services import db  # module import, access db.db
from app.services.moderation import check_content
from app.schemas.skill import Skill, SkillDB
from typing import List, Optional
from bson import ObjectId

router = APIRouter()


def get_uid(token_data: dict = Depends(verify_token)):
    return token_data.get("uid")


@router.post("/", response_model=SkillDB)
async def create_skill(skill: Skill, uid: str = Depends(get_uid)):
    # ── Content moderation ──
    await check_content(skill.name)
    if skill.description and skill.description.strip():
        await check_content(skill.description)
    doc = skill.dict()
    doc["owner_id"] = uid
    res = await db.db.skills.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return doc


@router.get("/", response_model=List[SkillDB])
async def list_skills(
    name: Optional[str] = Query(None),  # allow empty/absent
    limit: int = Query(100, ge=1, le=500),
):
    query = {}
    if name:
        # search by name only when non-empty
        query["name"] = {"$regex": name, "$options": "i"}
    cursor = db.db.skills.find(query).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        items.append(doc)
    return items


@router.get("/my/", response_model=List[SkillDB])
async def my_skills(uid: str = Depends(get_uid)):
    cursor = db.db.skills.find({"owner_id": uid})
    items = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        items.append(doc)
    return items


@router.delete("/{skill_id}/")
async def delete_skill(skill_id: str, uid: str = Depends(get_uid)):
    try:
        oid = ObjectId(skill_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid id")
    res = await db.db.skills.delete_one({"_id": oid, "owner_id": uid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Skill not found or not yours")
    return {"detail": "deleted"}
