from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from ..db.database import get_db
from ..models.category import Category
from ..api.auth import get_current_user
from ..models.user import User

# Pydantic models
class CategoryCreate(BaseModel):
    name: str

class CategoryUpdate(BaseModel):
    name: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

router = APIRouter()

def check_admin_or_manager(current_user: User):
    """Check if user has admin or manager role"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

def check_write_access(current_user: User):
    """Check if user can write (create/update/delete)"""
    if current_user.role == "salesman":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Salesman role has read-only access"
        )

@router.get("/", response_model=List[CategoryResponse])
async def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all categories."""
    categories = db.query(Category).all()
    return [
        CategoryResponse(
            id=cat.id,
            name=cat.name,
            created_at=cat.created_at.isoformat() if cat.created_at else "",
            updated_at=cat.updated_at.isoformat() if cat.updated_at else None
        )
        for cat in categories
    ]

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific category by ID."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return CategoryResponse(
        id=category.id,
        name=category.name,
        created_at=category.created_at.isoformat() if category.created_at else "",
        updated_at=category.updated_at.isoformat() if category.updated_at else None
    )

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new category."""
    check_write_access(current_user)
    
    # Check if category already exists
    existing_category = db.query(Category).filter(Category.name == category.name).first()
    if existing_category:
        raise HTTPException(
            status_code=400,
            detail="Category with this name already exists"
        )
    
    db_category = Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return CategoryResponse(
        id=db_category.id,
        name=db_category.name,
        created_at=db_category.created_at.isoformat() if db_category.created_at else "",
        updated_at=db_category.updated_at.isoformat() if db_category.updated_at else None
    )

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a category."""
    check_write_access(current_user)
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name already exists (if name is being updated)
    if category_update.name and category_update.name != category.name:
        existing_category = db.query(Category).filter(Category.name == category_update.name).first()
        if existing_category:
            raise HTTPException(
                status_code=400,
                detail="Category with this name already exists"
            )
        category.name = category_update.name
    
    db.commit()
    db.refresh(category)
    
    return CategoryResponse(
        id=category.id,
        name=category.name,
        created_at=category.created_at.isoformat() if category.created_at else "",
        updated_at=category.updated_at.isoformat() if category.updated_at else None
    )

@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a category."""
    check_write_access(current_user)
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    
    return {"message": "Category deleted successfully"}

# Create default categories for development
@router.post("/seed-categories")
async def seed_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create default categories for development."""
    default_categories = ["Beverages", "Snacks", "Meals", "Desserts", "Coffee", "Tea"]
    
    created_categories = []
    for cat_name in default_categories:
        existing = db.query(Category).filter(Category.name == cat_name).first()
        if not existing:
            new_category = Category(name=cat_name)
            db.add(new_category)
            created_categories.append(cat_name)
    
    db.commit()
    return {"message": f"Created categories: {created_categories}"}