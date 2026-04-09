from fastapi import APIRouter, Depends, HTTPException
from app.services.firebase import verify_token
from app.services import db
from app.schemas.notification import NotificationDB
from typing import List

router = APIRouter()


def get_uid(token_data: dict = Depends(verify_token)):
    return token_data.get("uid")


@router.get("/me/", response_model=List[NotificationDB])
async def my_notifications(uid: str = Depends(get_uid)):
    cursor = db.db.notifications.find({"user_id": uid}).sort("_id", -1)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        items.append(doc)
    return items


@router.post("/{notification_id}/read/")
async def mark_read(notification_id: str, uid: str = Depends(get_uid)):
    res = await db.db.notifications.update_one({"_id": notification_id, "user_id": uid}, {"$set": {"read": True}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"detail": "marked"}
