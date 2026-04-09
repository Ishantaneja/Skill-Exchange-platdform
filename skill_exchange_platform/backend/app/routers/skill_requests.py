from fastapi import APIRouter, Depends, HTTPException
from app.services.firebase import verify_token
from app.services import db
from app.services.moderation import check_content
from app.services.email_service import send_email
from app.schemas.skill_request import SkillRequestCreate, SkillRequestDB
from app.schemas.notification import NotificationCreate
from typing import List

router = APIRouter()


def get_uid(token_data: dict = Depends(verify_token)):
    return token_data.get("uid")


async def create_notification(n: NotificationCreate):
    await db.db.notifications.insert_one(n.dict())


@router.post("/", response_model=SkillRequestDB)
async def send_request(req: SkillRequestCreate, uid: str = Depends(get_uid)):
    print(f"[REQUESTS] POST /requests called  uid={uid}  payload={req.dict()}")
    # ── Content moderation ──
    await check_content(req.skill_offered)
    await check_content(req.skill_requested)
    if uid == req.to_user_id:
        raise HTTPException(status_code=400, detail="Cannot send request to yourself")
    from_user = await db.db.users.find_one({"_id": uid})
    to_user = await db.db.users.find_one({"_id": req.to_user_id})
    print(f"[REQUESTS] from_user exists={from_user is not None}  to_user exists={to_user is not None}")
    if not from_user or not to_user:
        raise HTTPException(status_code=404, detail="User not found")
    doc = req.dict()
    doc["from_user_id"] = uid
    doc["status"] = "pending"
    res = await db.db.skill_requests.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    print(f"[REQUESTS] Inserted request id={doc['id']}")
    # notify recipient
    notification = NotificationCreate(
        user_id=req.to_user_id,
        type="request",
        message=f"New skill request from {from_user.get('name')}",
        related_id=doc["id"],
    )
    await create_notification(notification)
    print(f"[REQUESTS] Notification created for user={req.to_user_id}")
    return doc


@router.get("/incoming/", response_model=List[SkillRequestDB])
async def incoming(uid: str = Depends(get_uid)):
    cursor = db.db.skill_requests.find({"to_user_id": uid})
    items = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        items.append(doc)
    return items


@router.get("/outgoing/", response_model=List[SkillRequestDB])
async def outgoing(uid: str = Depends(get_uid)):
    cursor = db.db.skill_requests.find({"from_user_id": uid})
    items = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        items.append(doc)
    return items


@router.post("/{request_id}/accept/", response_model=SkillRequestDB)
async def accept_request(request_id: str, uid: str = Depends(get_uid)):
    from bson import ObjectId
    try:
        oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid id")
    req = await db.db.skill_requests.find_one({"_id": oid})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req["to_user_id"] != uid:
        raise HTTPException(status_code=403, detail="Not authorized to accept")
    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already handled")
    await db.db.skill_requests.update_one({"_id": oid}, {"$set": {"status": "accepted"}})
    updated = await db.db.skill_requests.find_one({"_id": oid})
    updated["id"] = str(updated["_id"])
    # notify sender
    notification = NotificationCreate(
        user_id=updated["from_user_id"],
        type="status",
        message="Your skill request was accepted.",
        related_id=request_id,
    )
    await create_notification(notification)
    # Auto-create session from accepted request
    session_doc = {
        "user_a_id": req["from_user_id"],
        "user_b_id": req["to_user_id"],
        "skill_a": req["skill_offered"],
        "skill_b": req["skill_requested"],
        "status": "active",
    }
    session_res = await db.db.sessions.insert_one(session_doc)
    session_doc["id"] = str(session_res.inserted_id)
    # Notify both users about the session
    session_notification = NotificationCreate(
        user_id=req["from_user_id"],
        type="session",
        message="A session has been created for your accepted request.",
        related_id=session_doc["id"],
    )
    await create_notification(session_notification)
    session_notification.user_id = req["to_user_id"]
    await create_notification(session_notification)

    # ── Email notification to the request sender ──
    sender_user = await db.db.users.find_one({"_id": req["from_user_id"]})
    if sender_user and sender_user.get("email"):
        acceptor = await db.db.users.find_one({"_id": uid})
        acceptor_name = acceptor.get("name", "A user") if acceptor else "A user"
        await send_email(
            to=sender_user["email"],
            subject="Skill Exchange Request Accepted",
            html_body=(
                f"<h2>Good news!</h2>"
                f"<p>Hi <strong>{sender_user.get('name', 'there')}</strong>,</p>"
                f"<p><strong>{acceptor_name}</strong> has accepted your skill exchange request.</p>"
                f"<p><strong>You offered:</strong> {req.get('skill_offered', 'N/A')}<br>"
                f"<strong>You requested:</strong> {req.get('skill_requested', 'N/A')}</p>"
                f"<p>A session has been created automatically. "
                f"Head over to the platform to start your exchange!</p>"
                f"<br><p>— Skill Exchange Team</p>"
            ),
        )

    return updated


@router.post("/{request_id}/reject/", response_model=SkillRequestDB)
async def reject_request(request_id: str, uid: str = Depends(get_uid)):
    from bson import ObjectId
    try:
        oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid id")
    req = await db.db.skill_requests.find_one({"_id": oid})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req["to_user_id"] != uid:
        raise HTTPException(status_code=403, detail="Not authorized to reject")
    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already handled")
    await db.db.skill_requests.update_one({"_id": oid}, {"$set": {"status": "rejected"}})
    updated = await db.db.skill_requests.find_one({"_id": oid})
    updated["id"] = str(updated["_id"])
    notification = NotificationCreate(
        user_id=updated["from_user_id"],
        type="status",
        message="Your skill request was rejected.",
        related_id=request_id,
    )
    await create_notification(notification)
    return updated
