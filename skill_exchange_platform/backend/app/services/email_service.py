"""
Email notification service using Gmail SMTP (SSL, port 465).

Usage:
    from app.services.email_service import send_email
    await send_email("recipient@example.com", "Subject", "<h1>Body</h1>")

Credentials come from environment variables:
    EMAIL_ADDRESS   – Gmail address (sender)
    EMAIL_PASSWORD  – Gmail App Password

Fails gracefully: if credentials are missing or SMTP fails, the error is
logged but never propagated – the calling endpoint stays unaffected.
"""

import os
import smtplib
import asyncio
from email.message import EmailMessage
from dotenv import load_dotenv
load_dotenv()

_EMAIL_ADDRESS: str | None = os.getenv("EMAIL_ADDRESS")
_EMAIL_PASSWORD: str | None = os.getenv("EMAIL_PASSWORD")

if _EMAIL_ADDRESS and _EMAIL_PASSWORD:
    print(f"[EMAIL] Service ready  sender={_EMAIL_ADDRESS}")
else:
    print("[EMAIL] WARNING: EMAIL_ADDRESS / EMAIL_PASSWORD not set – email notifications disabled")


def _send_sync(to: str, subject: str, html_body: str) -> None:
    """Blocking SMTP send – runs inside a thread via asyncio."""
    msg = EmailMessage()
    msg["From"] = f"Skill Exchange Team <{_EMAIL_ADDRESS}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg["Reply-To"] = "no-reply@skillexchange.local"
    msg.set_content(html_body, subtype="html")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(_EMAIL_ADDRESS, _EMAIL_PASSWORD)
        server.send_message(msg)


async def send_email(to: str, subject: str, html_body: str) -> bool:
    """
    Send an email asynchronously (offloads to a thread so the event loop
    is never blocked).  Returns True on success, False on any failure.
    """
    if not _EMAIL_ADDRESS or not _EMAIL_PASSWORD:
        print("[EMAIL] Skipped – credentials not configured")
        return False

    try:
        await asyncio.to_thread(_send_sync, to, subject, html_body)
        print(f"[EMAIL] Sent to {to}  subject={subject!r}")
        return True
    except Exception as exc:
        print(f"[EMAIL] Failed to send to {to}: {exc}")
        return False
