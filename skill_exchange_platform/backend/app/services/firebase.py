import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# initialize Firebase Admin with service account key JSON
# safe to call multiple times (fastapi reload).
if not firebase_admin._apps:
    try:
        import os

        # 🔥 Render secret file path
        cred_path = "/etc/secrets/serviceAccountKey.json"

        print(f"[FIREBASE] trying to load from {cred_path}")

        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("[FIREBASE] admin sdk initialized ✅")
        else:
            print("[FIREBASE] No serviceAccountKey.json found → skipping ⚠️")

    except Exception as e:
        print(f"[FIREBASE] initialization error: {e}")

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    print(f"[FIREBASE] received token len={len(token) if token else 0}")
    return verify_token_str(token)


def _decode_jwt_payload(token: str) -> dict:
    # decode JWT payload without verifying signature
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return {}
        import base64, json
        payload = parts[1]
        # add padding if necessary
        missing_padding = len(payload) % 4
        if missing_padding:
            payload += '=' * (4 - missing_padding)
        decoded_bytes = base64.urlsafe_b64decode(payload)
        return json.loads(decoded_bytes)
    except Exception:
        return {}


def verify_token_str(token: str):
    # allow "dev" token for local development regardless of SDK state
    if token == "dev":
        print("[FIREBASE] using dev token → uid=dev")
        return {"uid": "dev"}

    # development: if service account wasn't initialized, fallback
    if not firebase_admin._apps:
        # try to extract uid from jwt payload for stability
        payload = _decode_jwt_payload(token)
        uid = payload.get('sub') or payload.get('user_id') or payload.get('uid')
        return {"uid": uid or token}

    # when admin SDK is available, do real verification
    # log a quick peek at the unverified payload to diagnose project/audience mismatches
    payload = _decode_jwt_payload(token)
    if payload:
        print(f"[FIREBASE] unverified JWT payload keys={list(payload.keys())} project_id={payload.get('aud') or payload.get('project_id')}")
    try:
        decoded = auth.verify_id_token(token)
        print(f"[FIREBASE] decoded token uid={decoded.get('uid')} sub={decoded.get('sub')} email={decoded.get('email')}")
        return decoded
    except Exception as e:
        print(f"[FIREBASE] token verification failed: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {e}")
