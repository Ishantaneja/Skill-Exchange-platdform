# 🎓 Skill Exchange Platform (Minor Project)

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

> **A peer-to-peer, barter-based knowledge sharing platform designed for college students.** Learn new skills by teaching what you know — no money involved. Includes real-time WebSocket chat, dual authentication (Firebase & 1-Click Dev Mode), automated email notifications, content moderation, and reputation scoring.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [1. Running the Full-Stack Application](#1-running-the-full-stack-application)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
  - [2. Running the Standalone Lightweight Prototype](#2-running-the-standalone-lightweight-prototype)
- [Authentication Modes](#-authentication-modes)
- [Environment Configuration](#-environment-configuration)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Academic & Presentation Notes](#-academic--presentation-notes)
- [Troubleshooting](#-troubleshooting)

---

## 🌟 Overview

Traditional tutoring platforms often impose financial barriers on students who wish to expand their skills. The **Skill Exchange Platform** addresses this challenge through a reciprocal barter model:

1. **List Skills**: Students specify what they can teach (e.g., Python, Graphic Design, Web Development) and what they want to learn.
2. **Discover & Request**: Users search for skills and propose barter exchanges.
3. **Barter & Learn**: When an exchange is accepted, a dedicated collaborative session is initiated.
4. **Real-Time Collaboration**: Students coordinate and discuss learning goals via integrated WebSocket chat.
5. **Rate & Build Trust**: After sessions, peers exchange ratings and reviews to build an authentic campus reputation score.

---

## ✨ Key Features

- **🔐 Dual Authentication Modes**:
  - **Firebase Google Sign-In**: Production-ready secure OAuth token authentication.
  - **1-Click Dev Login**: Instant bypass mode for local testing, grading, and viva presentations without requiring Firebase setup.
- **🔍 Skill Discovery & Search**: Real-time filtering by category, level, and keywords.
- **🤝 Barter Flow Lifecycle**: Propose, accept, reject, and complete skill exchange sessions.
- **💬 Real-Time WebSocket Chat**: Dedicated session-based instant messaging with presence tracking.
- **⭐ Reputation & Rating System**: 5-star rating and review system calculating weighted community trust scores.
- **🛡️ Content Moderation**: Built-in profanity and sensitive word filtering for platform safety.
- **📧 Email Notifications**: Automated Gmail SMTP alerts for exchange requests and status changes.
- **📱 Responsive Interface**: Clean, modern UI styled with Tailwind CSS.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    Client["React Frontend (Vite)
    Port 3000"]
    
    subgraph Backend_Services["FastAPI Application (Port 8000)"]
        Router["API Routers
        (Auth, Skills, Requests, Sessions)"]
        WS["WebSocket Chat Server"]
        Mod["Content Moderation"]
        Mailer["SMTP Email Service"]
    end
    
    DB[("MongoDB Database
    Port 27017")]
    AuthService["Firebase Authentication / Dev Auth"]
    
    Client -->|REST API Requests| Router
    Client -->|WebSocket Connection| WS
    Router -->|Async Queries (Motor)| DB
    Router -->|Token Verification| AuthService
    Router -->|Trigger Notifications| Mailer
    WS -->|Filter Messages| Mod
    WS -->|Persist Chat| DB
```

---

## 💻 Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite | High-performance SPA with modern React hooks |
| **Styling** | Tailwind CSS v4 | Utility-first responsive design |
| **Backend** | Python 3.10+, FastAPI | High-performance async REST & WebSocket framework |
| **Server Engine** | Uvicorn | ASGI web server implementation |
| **Database** | MongoDB | Document database via Motor (async Python driver) |
| **Authentication** | Firebase Auth & Dev Mode | Dual-mode token verification |
| **Real-Time** | WebSockets | Bidirectional low-latency chat communication |
| **Email Service** | Python `aiosmtplib` / `smtplib` | Automated email dispatch via Gmail SMTP |

---

## 📁 Project Structure

```text
Minor project/
├── README.md                                # Project documentation (this file)
│
├── Skill-Exchange-system-main/              # Full-Stack Application
│   └── skill_exchange_platform/
│       ├── backend/                         # FastAPI Backend
│       │   ├── app/
│       │   │   ├── routers/                 # API Endpoints (auth, skills, chat, sessions, etc.)
│       │   │   ├── services/                # DB, moderation, email services
│       │   │   ├── models/                  # Pydantic data schemas
│       │   │   └── main.py                  # Server entrypoint & CORS setup
│       │   ├── requirements.txt             # Backend dependencies
│       │   └── .env.example                 # Environment variables template
│       │
│       ├── frontend/                        # React Frontend
│       │   ├── src/
│       │   │   ├── components/              # UI components (Navbar, Modals, Cards)
│       │   │   ├── pages/                   # Views (Dashboard, Browse, Chat, Profile)
│       │   │   ├── services/                # API client & Firebase config
│       │   │   └── App.jsx                  # Main application routing
│       │   ├── package.json                 # Frontend dependencies
│       │   └── vite.config.js               # Vite bundler configuration
│       │
│       ├── Documentation.md                 # Detailed project specification
│       ├── QUICK_START.md                   # Fast-track testing checklist
│       └── DEBUG_GUIDE.md                   # Integration debug manual
│
├── back.py                                  # Standalone lightweight FastAPI backend (mock DB)
├── front.html                               # Standalone single-page frontend (connects to back.py)
├── Websockets.py                            # Standalone WebSocket chat demonstration
└── myapp/                                   # Supplemental React/Vite development workspace
```

---

## 🚀 Quick Start Guide

### Prerequisites

Ensure you have the following installed:
- **Python 3.10+**: `python --version`
- **Node.js 18+ & npm**: `node --version` and `npm --version`
- **MongoDB** (Local instance or MongoDB Atlas URI): `mongod --version`

---

### 1. Running the Full-Stack Application

#### Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd "Skill-Exchange-system-main/skill_exchange_platform/backend"
   ```

2. (Optional but recommended) Create and activate a virtual environment:
   ```bash
   # On Windows:
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your `.env` configuration:
   ```bash
   # Copy the example environment file
   copy .env.example .env
   ```
   *(Ensure MongoDB is running locally on port 27017 or update `MONGO_URI` in `.env`)*

5. Start the backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API Server: `http://127.0.0.1:8000`
   - Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

---

#### Frontend Setup

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd "Skill-Exchange-system-main/skill_exchange_platform/frontend"
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - Frontend Application: `http://localhost:3000`

4. In the browser, click **"Use dev login"** to instantly test the platform as an authenticated user without setting up Firebase credentials!

---

### 2. Running the Standalone Lightweight Prototype

For rapid demonstrations or environments without MongoDB/Node.js, this repository includes a zero-setup standalone prototype:

1. **Start the Mock API Server**:
   ```bash
   python back.py
   ```
   Starts a FastAPI server on `http://127.0.0.1:8000` pre-seeded with sample user and skill records.

2. **Open the Client**:
   - Double-click or open `front.html` directly in any web browser.
   - It connects seamlessly to `back.py` for skill browsing, search, and user logins.

3. **Standalone Real-time Chatroom**:
   ```bash
   python Websockets.py
   ```
   Visit `http://localhost:8000` to interact with a standalone multi-user WebSocket chatroom.

---

## 🔑 Authentication Modes

The platform supports two distinct authentication paths:

| Mode | Target Use Case | How It Works |
|---|---|---|
| **Dev Mode (1-Click Login)** | Presentations, Grading, Offline Dev | Click **"Use dev login"**. The app generates a mock token (`dev-user-token`) which the backend recognizes and creates an automatic developer profile for. |
| **Firebase Auth** | Production / Live Demo | Uses Google OAuth popup via Firebase Web SDK. Backend validates ID tokens using Firebase Admin SDK. |

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017

# Gmail SMTP for Email Notifications (Optional)
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

## 📡 API Reference

When the backend is running, full interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

### Key Endpoints

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/auth/login` | Verify Firebase ID token |
| **Auth** | `POST` | `/auth/dev-login` | Authenticate using Dev bypass token |
| **Profiles** | `GET` | `/profiles/me` | Fetch authenticated user profile |
| **Profiles** | `PUT` | `/profiles/me` | Update skills offered/wanted and bio |
| **Skills** | `GET` | `/skills` | Browse all skills (filter by category/search) |
| **Requests** | `POST` | `/skill-requests` | Send a barter exchange request |
| **Requests** | `POST` | `/skill-requests/{id}/accept` | Accept exchange request and create session |
| **Sessions** | `GET` | `/sessions` | List active & past exchange sessions |
| **Sessions** | `POST` | `/sessions/{id}/complete` | Mark learning session as finished |
| **Ratings** | `POST` | `/ratings` | Submit 5-star review & recalculate score |
| **Chat** | `WS` | `/ws/chat/{session_id}` | Real-time WebSocket chat channel |

---

## 🗄️ Database Schema

MongoDB collections managed by the application:

- **`users` / `profiles`**: User details, bio, avatar, skills offered, skills sought, average reputation score.
- **`skill_requests`**: Barter proposals containing sender, receiver, proposed skill, status (`pending`, `accepted`, `rejected`).
- **`sessions`**: Active barter exchanges linking two participants, scheduled times, and completion state.
- **`chat_messages`**: Persistent message log per `session_id` with sender, timestamp, and message body.
- **`ratings`**: Peer evaluations containing rating (1-5 stars), textual review, and session linkage.
- **`notifications`**: User notifications for request updates and session reminders.

---

## 🎓 Academic & Presentation Notes

- **Zero-Setup Grading**: Evaluators can run the system immediately using MongoDB and **Dev Mode**, without needing to create or configure Google Cloud / Firebase credentials.
- **Clean Architecture**: Clear separation of concerns between presentation (`React`), business logic (`FastAPI`), and persistence (`MongoDB`).
- **Real-Time Protocol**: Demonstrates practical WebSocket implementation for bidirectional peer communication.

---

## 🛠️ Troubleshooting

- **CORS Errors**: Ensure backend `allow_origins` includes your frontend URL (`http://localhost:3000`).
- **MongoDB Connection Refused**: Ensure MongoDB is running (`net start MongoDB` on Windows, or `mongod`).
- **Port Conflicts**:
  - Backend default port: `8000`
  - Frontend default port: `3000`
  - If port 3000 is occupied, run `npx kill-port 3000` or change port in `vite.config.js`.

---

## 👥 Contributors

- **Minor Project Team** — Academic Year 2025–2026

