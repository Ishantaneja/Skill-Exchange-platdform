from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from app.services.firebase import verify_token, verify_token_str
from app.services import db
from app.services.moderation import check_chat_rating
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter()


def get_uid(token_data: dict = Depends(verify_token)):
    return token_data.get("uid")


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket chat – uses the SAME single schema as REST endpoints."""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return
    try:
        data = verify_token_str(token)
        uid = data.get("uid")
    except Exception:
        await websocket.close(code=1008)
        return
    try:
        session_oid = ObjectId(session_id)
    except Exception:
        await websocket.close(code=1008)
        return
    sess = await db.db.sessions.find_one({"_id": session_oid})
    if not sess or uid not in [sess.get("user_a_id"), sess.get("user_b_id")]:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    try:
        while True:
            text = await websocket.receive_text()
            # ── Content moderation ──
            try:
                await check_chat_rating(text)
            except HTTPException:
                # Notify the sender their message was blocked, but keep connection open
                await websocket.send_text("[BLOCKED] Inappropriate content detected. Please use respectful language.")
                continue
            receiver = sess["user_b_id"] if uid == sess.get("user_a_id") else sess["user_a_id"]
            doc = {
                "session_id": session_id,
                "sender_uid": uid,
                "receiver_uid": receiver,
                "message_text": text,
                "timestamp": datetime.now(timezone.utc),
            }
            await db.db.messages.insert_one(doc)
            await websocket.send_text(text)
    except WebSocketDisconnect:
        pass
