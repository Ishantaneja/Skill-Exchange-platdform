# Skill Exchange Platform

This repository implements a college-minor peer-to-peer skill exchange platform using:

- **Frontend**: React (Vite) with Axios
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Authentication**: Firebase Authentication + JWT
- **Real-time chat**: WebSocket

## Project Overview

Students can offer skills they know, request skills they want, and barter sessions. Features include:

1. Firebase-based authentication
2. User profile management
3. Skill listing & search
4. Barter request flow with notifications
5. Session management
6. One-to-one chat per session
7. Ratings & reputation
8. In-app notifications

Optional paid learning is mentioned but not implemented.

## Getting Started

### Backend

1. Install dependencies (assumes Python 3.11+):
   ```bash
   cd FastApi/skill_exchange_platform/backend
   python -m venv venv
   venv\Scripts\activate    # Windows
   pip install fastapi motor uvicorn firebase-admin
   ```

2. (Optional) If you want real Firebase token verification, place your service account JSON in the same folder as `firebase.py` (`backend/app/services/serviceAccountKey.json`). The code now resolves the path relative to the services module.
   and update the initialization path in `app/services/firebase.py`. In development the server will accept any token
   and derive a stable user id from the JWT payload, or you can use the special dev token `dev`.

3. Start MongoDB locally on default port (or configure `MONGODB_URL`).

4. Run the server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend

1. Install Node dependencies:
   ```bash
   cd FastApi/skill_exchange_platform/frontend
   npm install
   npm run dev
   ```
2. Frontend Axios requests use direct backend base URL `http://127.0.0.1:8000` (no `/api` prefix).
3. Before starting the frontend you should add your Firebase web config to `src/firebase.js`.
   A sample file is already committed – replace the values with your project's.
   The login page uses Google sign‑in and will send the ID token to the backend.


## API Documentation

FastAPI provides interactive docs at `http://localhost:8000/docs` once the backend is running.

### Key Endpoints

- `POST /auth/login` – verify Firebase token & create profile.
- `GET /profiles/me` – fetch current user profile.
- `PUT /profiles/me` – update profile.
- `GET /skills` – list skills; query `name` for search.
- `POST /skills` – add new skill (authenticated).
- `GET /requests/incoming`, `/outgoing` – view barter requests.
- `POST /requests` – send a new skill request.
- `POST /requests/{id}/accept|reject` – handle requests.
- `POST /sessions` – create session from accepted request (also auto-called).
- `GET /sessions/me` – list user sessions.
- `POST /sessions/{id}/complete` – mark session complete.
- `ws://.../chat/ws/{session_id}` – WebSocket for real-time chat.
- `POST /ratings` – submit rating after session.
- `GET /notifications/me` – list notifications.

> For full details please refer to the Swagger UI.

## Database Schema

Collections with primary fields:

- `users`: `_id` (Firebase uid), `name`, `email`, `skills_offered`, `skills_wanted`, `availability`, `reputation`.
- `skills`: `_id`, `owner_id`, `name`, `description`.
- `skill_requests`: `_id`, `from_user_id`, `to_user_id`, `skill_offered`, `skill_requested`, `status`.
- `sessions`: `_id`, `user_a_id`, `user_b_id`, `skill_a`, `skill_b`, `status`.
- `messages`: `_id`, `session_id`, `sender_uid`, `receiver_uid`, `message_text`, `timestamp`.
- `ratings`: `_id`, `session_id`, `rater_id`, `ratee_id`, `score`, `feedback`.
- `notifications`: `_id`, `user_id`, `type`, `message`, `related_id`, `read`.

Relationships are maintained by storing user IDs and request/session references; these are simple one-to-many links and require manual lookup.

## Development Notes

- All protected routes require an `Authorization: Bearer <Firebase-ID-token>` header.
- Validation is enforced by Pydantic schemas; errors return 400/422.
- WebSocket connections also require the token as a query string `?token=...`.

## Future Scope

1. Add optional payment integration (Stripe, PayPal).
2. Enhance search with categories/tags.
3. Add email notifications or push.
4. Implement a rating aggregation graph.
5. Better UI/UX with Tailwind or Material UI.

## References

- FastAPI docs (https://fastapi.tiangolo.com/)
- Firebase Authentication
- MongoDB Manual
- React & Vite documentation

This project is academic and designed for demonstration in viva. The architecture is simple, realistic and explainable.
