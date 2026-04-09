from fastapi import APIRouter, Depends, HTTPException
from app.services.firebase import verify_token
from app.services import db
from app.services.moderation import check_chat_rating
from app.schemas.rating import RatingCreate, RatingDB
from typing import List

router = APIRouter()


def get_uid(token_data: dict = Depends(verify_token)):
    return token_data.get("uid")


async def recalc_reputation(user_id: str):
    cursor = db.db.ratings.find({"ratee_id": user_id})
    total = 0
    count = 0
    async for r in cursor:
        total += r.get("score", 0)
        count += 1
    rep = total / count if count > 0 else 0.0
    await db.db.users.update_one(
        {"_id": user_id},
        {"$set": {"reputation": rep, "total_ratings": count}},
    )


@router.post("/", response_model=RatingDB)
async def add_rating(r: RatingCreate, uid: str = Depends(get_uid)):
    # rater_id comes from authenticated user
    rater_id = uid
    # ensure session completed
    from bson import ObjectId
    try:
        oid = ObjectId(r.session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid id")
    sess = await db.db.sessions.find_one({"_id": oid})
    if not sess or sess.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Session not completed or not found")
    # ensure rater was participant
    if uid not in [sess.get("user_a_id"), sess.get("user_b_id")]:
        raise HTTPException(status_code=403, detail="Not a participant")
    # ensure not rating self
    if rater_id == r.ratee_id:
        raise HTTPException(status_code=400, detail="Cannot rate self")
    # ensure not duplicate
    existing = await db.db.ratings.find_one({
        "session_id": r.session_id,
        "rater_id": rater_id,
        "ratee_id": r.ratee_id,
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already rated")
    # ── Content moderation ──
    if r.feedback and r.feedback.strip():
        await check_chat_rating(r.feedback)

    doc = r.dict()
    doc["rater_id"] = rater_id
    res = await db.db.ratings.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    await recalc_reputation(r.ratee_id)
    return doc


@router.get("/user/{user_id}/", response_model=List[RatingDB])
async def ratings_for_user(user_id: str):
    cursor = db.db.ratings.find({"ratee_id": user_id})
    items = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        items.append(doc)
    return items
