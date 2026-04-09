from dotenv import load_dotenv
from pathlib import Path

# Load .env before any service module reads os.getenv()
_BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(_BASE_DIR / ".env")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback

from app.services.db import connect_to_mongo, close_mongo_connection
from app.routers import auth, profiles, skills, skill_requests, sessions, chat, ratings, notifications,admin

app = FastAPI(title="Skill Exchange Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
        "http://127.0.0.1:3004",
        "http://127.0.0.1:3005",
        "https://skill-exchange-system.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler so no error is silently swallowed."""
    tb = traceback.format_exc()
    print(f"[ERROR] Unhandled exception on {request.method} {request.url}:\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


@app.get("/")
async def root():
    return {"status": "ok", "message": "Skill Exchange Platform API is running"}


@app.on_event("startup")
async def startup_db():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_db():
    await close_mongo_connection()


# include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
app.include_router(skills.router, prefix="/skills", tags=["skills"])
app.include_router(skill_requests.router, prefix="/requests", tags=["skill_requests"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(ratings.router, prefix="/ratings", tags=["ratings"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])

# ── Debug: print all registered routes on startup ──────────────────
@app.on_event("startup")
async def _debug_print_routes():
    print("\n[ROUTE AUDIT] Registered routes:")
    for route in app.routes:
        methods = getattr(route, "methods", None)
        path = getattr(route, "path", None)
        if path and methods:
            print(f"  {', '.join(methods):8s}  {path}")
    print("[ROUTE AUDIT] Done.\n")
