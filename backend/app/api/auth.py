from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel
from typing import Optional

from ..db.database import get_db
from ..core.security import verify_password, get_password_hash, create_access_token, verify_token
from ..core.config import settings
from ..models.user import User

# Pydantic models for request/response
class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class LoginResponse(BaseModel):
    auth_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

# Security
security = HTTPBearer()
router = APIRouter()

def get_user_by_username_or_email(db: Session, username_or_email: str):
    """Get user by username or email."""
    return db.query(User).filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

def authenticate_user(db: Session, username_or_email: str, password: str):
    """Authenticate user with username/email and password."""
    user = get_user_by_username_or_email(db, username_or_email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(credentials.credentials)
        if payload is None:
            raise credentials_exception
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    user = get_user_by_username_or_email(db, username)
    if user is None:
        raise credentials_exception
    return user

def require_role(allowed_roles: list):
    """Decorator to require specific roles for endpoint access."""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return current_user
    return role_checker

# Role-specific dependencies
def get_admin_user(current_user: User = Depends(require_role(["admin"]))):
    """Require admin role."""
    return current_user

def get_admin_or_manager_user(current_user: User = Depends(require_role(["admin", "manager"]))):
    """Require admin or manager role."""
    return current_user

def get_any_role_user(current_user: User = Depends(require_role(["admin", "manager", "salesman"]))):
    """Allow any authenticated user."""
    return current_user

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = authenticate_user(db, login_data.username_or_email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return LoginResponse(auth_token=access_token)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat() if current_user.created_at else "",
        updated_at=current_user.updated_at.isoformat() if current_user.updated_at else None
    )

# Create default admin user on startup (for development)
@router.post("/create-admin")
async def create_admin_user(db: Session = Depends(get_db)):
    """Create default admin user (development only)."""
    existing_admin = db.query(User).filter(User.username == "admin").first()
    if existing_admin:
        return {"message": "Admin user already exists"}
    
    admin_user = User(
        username="admin",
        email="admin@cafe.com",
        hashed_password=get_password_hash("admin123"),
        role="admin",
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    return {"message": "Admin user created successfully", "username": "admin", "password": "admin123"}