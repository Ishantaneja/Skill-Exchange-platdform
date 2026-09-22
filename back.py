# main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import uvicorn

# Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI(title="SkillSwap API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# In-memory databases (replace with real database in production)
users_db = {}
skills_db = []
skill_id_counter = 1

# ==================== Models ====================

class User(BaseModel):
    email: EmailStr
    username: str
    full_name: str

class UserCreate(User):
    password: str

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Skill(BaseModel):
    userName: str
    offering: str
    seeking: str
    description: str
    level: str
    category: str

class SkillResponse(Skill):
    id: int
    userAvatar: str
    created_at: str
    user_email: str

class SkillCreate(Skill):
    pass

class ConnectionRequest(BaseModel):
    skill_id: int
    message: Optional[str] = ""

# ==================== Helper Functions ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    email = payload.get("sub")
    if email is None or email not in users_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    return users_db[email]

def create_avatar(name: str) -> str:
    return ''.join([word[0].upper() for word in name.split() if word])

# ==================== Authentication Routes ====================

@app.post("/api/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    """Register a new user"""
    if user.email in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    users_db[user.email] = user_in_db
    
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
async def login(email: EmailStr, password: str):
    """Login user and return JWT token"""
    user = users_db.get(email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(
        data={"sub": email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=User)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    """Get current user information"""
    return User(
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name
    )

# ==================== Skills Routes ====================

@app.get("/api/skills", response_model=List[SkillResponse])
async def get_skills(
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all skills with optional filtering"""
    filtered_skills = skills_db.copy()
    
    if category and category != "All":
        filtered_skills = [s for s in filtered_skills if s["category"] == category]
    
    if search:
        search_lower = search.lower()
        filtered_skills = [
            s for s in filtered_skills
            if search_lower in s["offering"].lower() or
               search_lower in s["seeking"].lower() or
               search_lower in s["userName"].lower()
        ]
    
    return filtered_skills

@app.get("/api/skills/{skill_id}", response_model=SkillResponse)
async def get_skill(skill_id: int):
    """Get a specific skill by ID"""
    skill = next((s for s in skills_db if s["id"] == skill_id), None)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    return skill

@app.post("/api/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(
    skill: SkillCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Create a new skill exchange"""
    global skill_id_counter
    
    new_skill = {
        "id": skill_id_counter,
        "userName": current_user.full_name,
        "userAvatar": create_avatar(current_user.full_name),
        "offering": skill.offering,
        "seeking": skill.seeking,
        "description": skill.description,
        "level": skill.level,
        "category": skill.category,
        "created_at": datetime.utcnow().isoformat(),
        "user_email": current_user.email
    }
    
    skills_db.append(new_skill)
    skill_id_counter += 1
    
    return new_skill

@app.put("/api/skills/{skill_id}", response_model=SkillResponse)
async def update_skill(
    skill_id: int,
    skill: SkillCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update an existing skill"""
    skill_index = next((i for i, s in enumerate(skills_db) if s["id"] == skill_id), None)
    
    if skill_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    if skills_db[skill_index]["user_email"] != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this skill"
        )
    
    skills_db[skill_index].update({
        "offering": skill.offering,
        "seeking": skill.seeking,
        "description": skill.description,
        "level": skill.level,
        "category": skill.category,
    })
    
    return skills_db[skill_index]

@app.delete("/api/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """Delete a skill"""
    skill_index = next((i for i, s in enumerate(skills_db) if s["id"] == skill_id), None)
    
    if skill_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    if skills_db[skill_index]["user_email"] != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this skill"
        )
    
    skills_db.pop(skill_index)
    return None

@app.get("/api/skills/user/me", response_model=List[SkillResponse])
async def get_my_skills(current_user: UserInDB = Depends(get_current_user)):
    """Get all skills posted by current user"""
    return [s for s in skills_db if s["user_email"] == current_user.email]

# ==================== Connection Routes ====================

@app.post("/api/connect", status_code=status.HTTP_200_OK)
async def connect_with_user(
    connection: ConnectionRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Send a connection request to another user"""
    skill = next((s for s in skills_db if s["id"] == connection.skill_id), None)
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    if skill["user_email"] == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot connect with yourself"
        )
    
    # In a real app, this would send a notification/email
    return {
        "message": f"Connection request sent to {skill['userName']}",
        "skill_id": connection.skill_id
    }

# ==================== Health Check ====================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

# ==================== Run Server ====================

if __name__ == "__main__":
    # Add some sample data
    sample_user = UserInDB(
        email="demo@example.com",
        username="demo_user",
        full_name="Demo User",
        hashed_password=get_password_hash("demo123")
    )
    users_db["demo@example.com"] = sample_user
    
    skills_db.extend([
        {
            "id": 1,
            "userName": "Sarah Chen",
            "userAvatar": "SC",
            "offering": "Web Development",
            "seeking": "Graphic Design",
            "description": "Full-stack developer with 5 years experience. Can teach React, Node.js, and MongoDB.",
            "level": "Expert",
            "category": "Technology",
            "created_at": datetime.utcnow().isoformat(),
            "user_email": "demo@example.com"
        },
        {
            "id": 2,
            "userName": "Mike Johnson",
            "userAvatar": "MJ",
            "offering": "Guitar Lessons",
            "seeking": "Spanish Language",
            "description": "Classical guitarist with 10 years teaching experience. All levels welcome.",
            "level": "Intermediate",
            "category": "Music",
            "created_at": datetime.utcnow().isoformat(),
            "user_email": "demo@example.com"
        }
    ])
    skill_id_counter = 3
    
    uvicorn.run(app, host="0.0.0.0", port=8000)