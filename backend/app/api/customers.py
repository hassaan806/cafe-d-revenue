from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import List, Optional

from ..db.database import get_db
from ..models.customer import Customer
from ..api.auth import get_current_user
from ..models.user import User
from ..utils.sms import sms_service

# Pydantic models
class CustomerCreate(BaseModel):
    name: str
    phone: str
    rfid_no: str
    card_number: str
    balance: float = 0.0
    # Add card_discount field with proper default and validation
    card_discount: float = 0.0
    
    class Config:
        # Ensure card_discount has a minimum value of 0
        @validator('card_discount')
        def validate_card_discount(cls, v):
            if v < 0:
                raise ValueError('Card discount cannot be negative')
            if v > 100:
                raise ValueError('Card discount cannot be greater than 100')
            return v

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    rfid_no: Optional[str] = None
    card_number: Optional[str] = None
    balance: Optional[float] = None
    # Add card_discount field with proper validation
    card_discount: Optional[float] = None
    
    class Config:
        # Ensure card_discount has a minimum value of 0
        @validator('card_discount')
        def validate_card_discount(cls, v):
            if v is not None:
                if v < 0:
                    raise ValueError('Card discount cannot be negative')
                if v > 100:
                    raise ValueError('Card discount cannot be greater than 100')
            return v

class CustomerResponse(BaseModel):
    id: int
    name: str
    phone: str
    rfid_no: str
    card_number: str
    balance: float
    created_at: str
    updated_at: Optional[str] = None
    # Add card_discount field with proper default
    card_discount: float = 0.0

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

def check_card_management_access(current_user: User):
    """Check if user can manage cards (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can manage card operations"
        )

def check_low_balance_alert(customer: Customer):
    """Check if customer balance is low and send alert SMS"""
    try:
        # Check if balance is below threshold (100 PKR)
        if customer.balance < 100:
            message = f"LOW BALANCE ALERT\nCafe D Revenue\nCurrent Bal: PKR {customer.balance:.2f}\nPlease recharge your card soon."
            sms_service.send_sms(customer.phone, message)
    except Exception as e:
        print(f"Failed to send low balance alert SMS: {str(e)}")

@router.get("/", response_model=List[CustomerResponse])
async def get_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all customers."""
    customers = db.query(Customer).all()
    return [
        CustomerResponse(
            id=cust.id,
            name=cust.name,
            phone=cust.phone,
            rfid_no=cust.rfid_no,
            card_number=cust.card_number,
            balance=cust.balance,
            created_at=cust.created_at.isoformat() if cust.created_at else "",
            updated_at=cust.updated_at.isoformat() if cust.updated_at else None,
            # Add card_discount field
            card_discount=cust.card_discount
        )
        for cust in customers
    ]

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific customer by ID."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return CustomerResponse(
        id=customer.id,
        name=customer.name,
        phone=customer.phone,
        rfid_no=customer.rfid_no,
        card_number=customer.card_number,
        balance=customer.balance,
        created_at=customer.created_at.isoformat() if customer.created_at else "",
        updated_at=customer.updated_at.isoformat() if customer.updated_at else None,
        # Add card_discount field
        card_discount=customer.card_discount
    )

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new customer."""
    # Check if customer with phone already exists
    existing_customer = db.query(Customer).filter(Customer.phone == customer.phone).first()
    if existing_customer:
        raise HTTPException(
            status_code=400,
            detail="Customer with this phone number already exists"
        )
    
    # Check if RFID or card number already exists
    existing_rfid = db.query(Customer).filter(Customer.rfid_no == customer.rfid_no).first()
    if existing_rfid:
        raise HTTPException(
            status_code=400,
            detail="Customer with this RFID number already exists"
        )
    
    existing_card = db.query(Customer).filter(Customer.card_number == customer.card_number).first()
    if existing_card:
        raise HTTPException(
            status_code=400,
            detail="Customer with this card number already exists"
        )
    
    db_customer = Customer(
        name=customer.name,
        phone=customer.phone,
        rfid_no=customer.rfid_no,
        card_number=customer.card_number,
        balance=customer.balance,
        # Add card_discount field
        card_discount=customer.card_discount
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    # Send SMS notification for new customer registration with improved formatting
    try:
        message = f"WELCOME\nCafe D Revenue\nCard: {customer.card_number}\nBal: PKR {customer.balance:.2f}\nThank you for registering!"
        sms_service.send_sms(customer.phone, message)
    except Exception as e:
        print(f"Failed to send registration SMS: {str(e)}")
    
    return CustomerResponse(
        id=db_customer.id,
        name=db_customer.name,
        phone=db_customer.phone,
        rfid_no=db_customer.rfid_no,
        card_number=db_customer.card_number,
        balance=db_customer.balance,
        created_at=db_customer.created_at.isoformat() if db_customer.created_at else "",
        updated_at=db_customer.updated_at.isoformat() if db_customer.updated_at else None,
        # Add card_discount field
        card_discount=db_customer.card_discount
    )

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check for duplicate phone if being updated
    if customer_update.phone and customer_update.phone != customer.phone:
        existing_phone = db.query(Customer).filter(Customer.phone == customer_update.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=400,
                detail="Customer with this phone number already exists"
            )
    
    # Check for duplicate RFID if being updated
    if customer_update.rfid_no and customer_update.rfid_no != customer.rfid_no:
        existing_rfid = db.query(Customer).filter(Customer.rfid_no == customer_update.rfid_no).first()
        if existing_rfid:
            raise HTTPException(
                status_code=400,
                detail="Customer with this RFID number already exists"
            )
    
    # Check for duplicate card number if being updated
    if customer_update.card_number and customer_update.card_number != customer.card_number:
        existing_card = db.query(Customer).filter(Customer.card_number == customer_update.card_number).first()
        if existing_card:
            raise HTTPException(
                status_code=400,
                detail="Customer with this card number already exists"
            )
    
    # Store old balance for low balance check
    old_balance = customer.balance
    
    # Update fields if provided
    if customer_update.name is not None:
        customer.name = customer_update.name
    if customer_update.phone is not None:
        customer.phone = customer_update.phone
    if customer_update.rfid_no is not None:
        customer.rfid_no = customer_update.rfid_no
    if customer_update.card_number is not None:
        customer.card_number = customer_update.card_number
    if customer_update.balance is not None:
        customer.balance = customer_update.balance
    # Add card_discount field update
    if customer_update.card_discount is not None:
        customer.card_discount = customer_update.card_discount
    
    db.commit()
    db.refresh(customer)
    
    # Check for low balance alert after update
    if customer_update.balance is not None and customer_update.balance != old_balance:
        check_low_balance_alert(customer)
    
    return CustomerResponse(
        id=customer.id,
        name=customer.name,
        phone=customer.phone,
        rfid_no=customer.rfid_no,
        card_number=customer.card_number,
        balance=customer.balance,
        created_at=customer.created_at.isoformat() if customer.created_at else "",
        updated_at=customer.updated_at.isoformat() if customer.updated_at else None,
        # Add card_discount field
        card_discount=customer.card_discount
    )

@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    
    return {"message": "Customer deleted successfully"}

@router.get("/search/by-card/{card_number}", response_model=CustomerResponse)
async def get_customer_by_card(
    card_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get customer by card number."""
    customer = db.query(Customer).filter(Customer.card_number == card_number).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return CustomerResponse(
        id=customer.id,
        name=customer.name,
        phone=customer.phone,
        rfid_no=customer.rfid_no,
        card_number=customer.card_number,
        balance=customer.balance,
        created_at=customer.created_at.isoformat() if customer.created_at else "",
        updated_at=customer.updated_at.isoformat() if customer.updated_at else None,
        # Add card_discount field
        card_discount=customer.card_discount
    )

@router.get("/search/by-rfid/{rfid_no}", response_model=CustomerResponse)
async def get_customer_by_rfid(
    rfid_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get customer by RFID number."""
    customer = db.query(Customer).filter(Customer.rfid_no == rfid_no).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return CustomerResponse(
        id=customer.id,
        name=customer.name,
        phone=customer.phone,
        rfid_no=customer.rfid_no,
        card_number=customer.card_number,
        balance=customer.balance,
        created_at=customer.created_at.isoformat() if customer.created_at else "",
        updated_at=customer.updated_at.isoformat() if customer.updated_at else None,
        # Add card_discount field
        card_discount=customer.card_discount
    )