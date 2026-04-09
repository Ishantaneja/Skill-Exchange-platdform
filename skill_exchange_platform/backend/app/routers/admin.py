from fastapi import APIRouter, Depends, HTTPException
from app.services.firebase import verify_token
from app.services import db as db_module

router = APIRouter()

ADMIN_UID = "u4w0Yrvil6UqG9Oh1j5wqfNqwnt1"


def require_admin(user_data: dict = Depends(verify_token)):
    uid = user_data.get("uid")
    if uid != ADMIN_UID:
        raise HTTPException(status_code=403, detail="Access Denied")
    return user_data


@router.get("/stats")
async def get_admin_stats(_: dict = Depends(require_admin)):
    total_users = await db_module.db.users.count_documents({})
    total_requests = await db_module.db.skill_requests.count_documents({})
    pending_requests = await db_module.db.skill_requests.count_documents({"status": "pending"})
    completed_sessions = await db_module.db.sessions.count_documents({"status": "completed"})
    active_sessions = await db_module.db.sessions.count_documents({"status": "active"})

    return {
        "total_users": total_users,
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "completed_sessions": completed_sessions,
        "active_sessions": active_sessions,
    }