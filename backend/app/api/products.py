from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import shutil
import os
import time
from pathlib import Path

from ..db.database import get_db
from ..models.product import Product
from ..models.category import Category
from ..api.auth import get_current_user
from ..models.user import User

# Pydantic models
class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    stock: int
    image_url: Optional[str] = None
    category_id: int

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int
    image_url: Optional[str] = None
    category_id: int
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

router = APIRouter()

def check_write_access(current_user: User):
    """Check if user can write (create/update/delete)"""
    if current_user.role == "salesman":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Salesman role has read-only access"
        )

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/products")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/", response_model=List[ProductResponse])
async def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all products."""
    products = db.query(Product).all()
    return [
        ProductResponse(
            id=prod.id,
            name=prod.name,
            description=prod.description,
            price=prod.price,
            stock=prod.stock,
            image_url=prod.image_url,
            category_id=prod.category_id,
            created_at=prod.created_at.isoformat() if prod.created_at else "",
            updated_at=prod.updated_at.isoformat() if prod.updated_at else None
        )
        for prod in products
    ]

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        price=product.price,
        stock=product.stock,
        image_url=product.image_url,
        category_id=product.category_id,
        created_at=product.created_at.isoformat() if product.created_at else "",
        updated_at=product.updated_at.isoformat() if product.updated_at else None
    )

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new product."""
    check_write_access(current_user)
    # Verify category exists
    category = db.query(Category).filter(Category.id == product.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Category not found")
    
    # Check if product already exists
    existing_product = db.query(Product).filter(Product.name == product.name).first()
    if existing_product:
        raise HTTPException(
            status_code=400,
            detail="Product with this name already exists"
        )
    
    db_product = Product(
        name=product.name,
        description=product.description,
        price=product.price,
        stock=product.stock,
        image_url=product.image_url,
        category_id=product.category_id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    return ProductResponse(
        id=db_product.id,
        name=db_product.name,
        description=db_product.description,
        price=db_product.price,
        stock=db_product.stock,
        image_url=db_product.image_url,
        category_id=db_product.category_id,
        created_at=db_product.created_at.isoformat() if db_product.created_at else "",
        updated_at=db_product.updated_at.isoformat() if db_product.updated_at else None
    )

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a product."""
    check_write_access(current_user)
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Verify category exists if category_id is being updated
    if product_update.category_id and product_update.category_id != product.category_id:
        category = db.query(Category).filter(Category.id == product_update.category_id).first()
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
    
    # Update fields if provided
    if product_update.name is not None:
        product.name = product_update.name
    if product_update.description is not None:
        product.description = product_update.description
    if product_update.price is not None:
        product.price = product_update.price
    if product_update.stock is not None:
        product.stock = product_update.stock
    if product_update.image_url is not None:
        product.image_url = product_update.image_url
    if product_update.category_id is not None:
        product.category_id = product_update.category_id
    
    db.commit()
    db.refresh(product)
    
    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        price=product.price,
        stock=product.stock,
        image_url=product.image_url,
        category_id=product.category_id,
        created_at=product.created_at.isoformat() if product.created_at else "",
        updated_at=product.updated_at.isoformat() if product.updated_at else None
    )

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a product."""
    check_write_access(current_user)
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    
    return {"message": "Product deleted successfully"}

@router.post("/{product_id}/upload-image", response_model=ProductResponse)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload an image for a product."""
    check_write_access(current_user)
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    new_filename = f"product_{product_id}_{int(time.time())}.{file_extension}"
    file_path = UPLOAD_DIR / new_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update product with image URL
    product.image_url = f"/uploads/products/{new_filename}"
    db.commit()
    db.refresh(product)
    
    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        price=product.price,
        stock=product.stock,
        image_url=product.image_url,
        category_id=product.category_id,
        created_at=product.created_at.isoformat() if product.created_at else "",
        updated_at=product.updated_at.isoformat() if product.updated_at else None
    )