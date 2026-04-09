from fastapi import APIRouter, Depends, HTTPException
from app.services.firebase import verify_token
from app.services import db
from app.services.moderation import check_chat_rating
from app.schemas.session import SessionCreate, SessionDB
from app.schemas.message import MessageCreate
from app.schemas.notification import NotificationCreate
from typing import List
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter()


def get_uid(token_data: dict = Depends(verify_token)):
    return token_data.get("uid")


async def create_session_from_request(request_id: str):
    from bson import ObjectId
    try:
        oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid id")
    req = await db.db.skill_requests.find_one({"_id": oid})
    if not req or req.get("status") != "accepted":
        raise HTTPException(status_code=400, detail="Request not accepted or not found")
    # create session doc
    doc = {
        "user_a_id": req["from_user_id"],
        "user_b_id": req["to_user_id"],
        "skill_a": req["skill_offered"],
        "skill_b": req["skill_requested"],
        "status": "active",
    }
    res = await db.db.sessions.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    # notify both users
    notification = NotificationCreate(
        user_id=req["from_user_id"],
        type="session",
        message="A session has been created for your accepted request.",
        related_id=doc["id"],
    )
    await db.db.notifications.insert_one(notification.dict())
    notification.user_id = req["to_user_id"]
    await db.db.notifications.insert_one(notification.dict())
    return doc


@router.post("/", response_model=SessionDB)
async def create_session(input: SessionCreate, uid: str = Depends(get_uid)):
    # verify request is accepted and user is a participant
    from bson import ObjectId
    try:
        oid = ObjectId(input.request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid request id")
    req = await db.db.skill_requests.find_one({"_id": oid})
    if not req or req.get("status") != "accepted":
        raise HTTPException(status_code=400, detail="Request not accepted or not found")
    if uid not in [req["from_user_id"], req["to_user_id"]]:
        raise HTTPException(status_code=403, detail="Not a participant of the request")
    session = await create_session_from_request(input.request_id)
    return session


@router.get("/me/", response_model=List[SessionDB])
async def my_sessions(uid: str = Depends(get_uid)):
    print(f"[SESSIONS] GET /me  uid={uid}")
    cursor = db.db.sessions.find({"$or": [{"user_a_id": uid}, {"user_b_id": uid}]})
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        items.append(doc)
    print(f"[SESSIONS] Returning {len(items)} sessions")
    return items


@router.post("/{session_id}/complete/", response_model=SessionDB)
async def complete_session(session_id: str, uid: str = Depends(get_uid)):
    print(f"[SESSIONS] POST /{session_id}/complete  uid={uid}")
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid id")
    sess = await db.db.sessions.find_one({"_id": oid})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    if uid not in [sess["user_a_id"], sess["user_b_id"]]:
        raise HTTPException(status_code=403, detail="Not a participant")
    if sess["status"] == "completed":
        raise HTTPException(status_code=400, detail="Already completed")
    await db.db.sessions.update_one({"_id": oid}, {"$set": {"status": "completed"}})
    sess = await db.db.sessions.find_one({"_id": oid})
    sess["id"] = str(sess.pop("_id"))
    return sess


# ─── Chat Messages (REST) ───────────────────────────────────────────────────

async def _get_session_or_403(session_id: str, uid: str):
    """Return the session dict or raise 400/403/404."""
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    sess = await db.db.sessions.find_one({"_id": oid})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    if uid not in [sess.get("user_a_id"), sess.get("user_b_id")]:
        raise HTTPException(status_code=403, detail="Not a participant of this session")
    return sess


@router.get("/{session_id}/messages/")
async def get_messages(session_id: str, uid: str = Depends(get_uid)):
    """Return all messages for a session, sorted oldest-first. No response_model — plain dicts."""
    await _get_session_or_403(session_id, uid)
    print(f"[CHAT] GET messages  session={session_id}  uid={uid}")
    cursor = db.db.messages.find({"session_id": session_id}).sort("timestamp", 1)
    items = []
    async for doc in cursor:
        items.append({
            "id": str(doc["_id"]),
            "session_id": doc["session_id"],
            "sender_uid": doc["sender_uid"],
            "receiver_uid": doc["receiver_uid"],
            "message_text": doc["message_text"],
            "timestamp": doc["timestamp"].isoformat() + "Z",
        })
    print(f"[CHAT] Returning {len(items)} messages")
    return items


@router.post("/{session_id}/messages/")
async def send_message(session_id: str, body: MessageCreate, uid: str = Depends(get_uid)):
    """Store a new chat message. sender_uid from token, receiver derived from session."""
    print(f"[CHAT] POST message  session={session_id}  uid={uid}  text={body.message_text!r}")
    # ── Content moderation ──
    await check_chat_rating(body.message_text)
    sess = await _get_session_or_403(session_id, uid)
    receiver = sess["user_b_id"] if uid == sess["user_a_id"] else sess["user_a_id"]
    now = datetime.now(timezone.utc)
    doc = {
        "session_id": session_id,
        "sender_uid": uid,
        "receiver_uid": receiver,
        "message_text": body.message_text,
        "timestamp": now,
    }
    res = await db.db.messages.insert_one(doc)
    inserted_id = str(res.inserted_id)
    print(f"[CHAT] Message stored  id={inserted_id}  from={uid}  to={receiver}")
    return {
        "id": inserted_id,
        "session_id": session_id,
        "sender_uid": uid,
        "receiver_uid": receiver,
        "message_text": body.message_text,
        "timestamp": now.isoformat() + "Z",
    }
