from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import json
import time

from ..db.database import get_db
from ..models.sales import Sale, RechargeTransaction
from ..models.customer import Customer
from ..models.product import Product
from ..api.auth import get_current_user, get_any_role_user, get_admin_or_manager_user
from ..models.user import User
from ..utils.sms import sms_service

# Pydantic models
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    room_no: str
    payment_method: str  # cash, card, easypaisa, pending
    items: List[SaleItemCreate]

class SaleItemResponse(BaseModel):
    product_id: int
    quantity: int

class SaleResponse(BaseModel):
    id: int
    total_price: float
    payment_method: str
    is_settled: bool
    timestamp: str
    room_no: str
    customer_id: Optional[int] = None
    items: List[SaleItemResponse]
    payments: List

    class Config:
        from_attributes = True

class SettleSaleRequest(BaseModel):
    payment_method: str  # cash, card, easypaisa
    customer_id: Optional[int] = None

class BatchSettleSaleRequest(BaseModel):
    sale_ids: List[int]
    payment_method: str  # cash, card, easypaisa
    customer_id: Optional[int] = None

class BatchSettleResponse(BaseModel):
    settled_count: int
    failed_count: int
    settled_sales: List[int]
    failed_sales: List[dict]  # [{"sale_id": int, "error": str}]

class RechargeRequest(BaseModel):
    customer_id: int
    amount: float

class RechargeResponse(BaseModel):
    id: int
    customer_id: int
    amount: float
    recharge_date: str

    class Config:
        from_attributes = True

router = APIRouter()

def format_items_for_sms(sale_items, products):
    """Format sale items for SMS notification"""
    items_text = []
    for item in sale_items:
        product = next((p for p in products if p.id == item["product_id"]), None)
        product_name = product.name if product else f"Product #{item['product_id']}"
        items_text.append(f"{product_name} x{item['quantity']}")
    return ", ".join(items_text)

@router.get("/", response_model=List[SaleResponse])
async def get_sales(
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_role_user)
):
    """Get all sales with pagination for better performance."""
    # Calculate offset
    offset = (page - 1) * per_page
    
    # Get sales with limit and offset for pagination
    sales = db.query(Sale).order_by(Sale.timestamp.desc()).offset(offset).limit(per_page).all()
    
    # Use optimized response format
    return [
        SaleResponse(
            id=sale.id,
            total_price=sale.total_price,
            payment_method=sale.payment_method,
            is_settled=sale.is_settled,
            timestamp=sale.timestamp.isoformat() if sale.timestamp else "",
            room_no=sale.room_no,
            customer_id=sale.customer_id,
            items=[SaleItemResponse(**item) for item in sale.items] if sale.items else [],
            payments=sale.payments if sale.payments else []
        )
        for sale in sales
    ]

@router.get("/pending")
async def get_pending_sales_summary(
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get pending sales summary for a customer or all customers."""
    query = db.query(Sale).filter(Sale.is_settled == False)
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)
    
    pending_sales = query.all()
    total_pending = sum(sale.total_price for sale in pending_sales)
    
    return {
        "total_pending_amount": total_pending,
        "pending_sales_count": len(pending_sales),
        "sales": [sale.id for sale in pending_sales]
    }

@router.get("/{sale_id}", response_model=SaleResponse)
async def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific sale by ID."""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    return SaleResponse(
        id=sale.id,
        total_price=sale.total_price,
        payment_method=sale.payment_method,
        is_settled=sale.is_settled,
        timestamp=sale.timestamp.isoformat() if sale.timestamp else "",
        room_no=sale.room_no,
        customer_id=sale.customer_id,
        items=[SaleItemResponse(**item) for item in sale.items] if sale.items else [],
        payments=sale.payments if sale.payments else []
    )

@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_role_user)
):
    """Create a new sale with full validation and proper error handling."""
    start_time = time.time()
    
    try:
        # Verify customer exists (only if customer_id is provided)
        customer = None
        if sale.customer_id:
            customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
            if not customer:
                raise HTTPException(status_code=400, detail="Customer not found")
        
        # Calculate total price and verify products
        total_price = 0.0
        sale_items = []
        
        # Get all products for SMS formatting
        product_ids = [item.product_id for item in sale.items]
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        
        for item in sale.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
            
            # Check stock availability
            if product.stock < item.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient stock for product {product.name}. Available: {product.stock}, Requested: {item.quantity}"
                )
            
            item_total = product.price * item.quantity
            total_price += item_total
            
            sale_items.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": product.price,
                "total_price": item_total,
                "product_name": product.name
            })
            
            # Update product stock
            product.stock -= item.quantity
        
        # For card payments, check customer balance (customer must be provided)
        if sale.payment_method == "card":
            if not customer:
                raise HTTPException(status_code=400, detail="Customer is required for card payments")
            if customer.balance < total_price:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient balance. Customer balance: {customer.balance}, Sale total: {total_price}"
                )
            # Deduct from customer balance
            customer.balance -= total_price
        
        # Create sale record with enhanced data
        db_sale = Sale(
            total_price=total_price,
            payment_method=sale.payment_method,
            is_settled=sale.payment_method != "pending",
            room_no=sale.room_no,
            customer_id=sale.customer_id,
            items=sale_items,
            payments=[]
        )
        
        db.add(db_sale)
        db.commit()
        db.refresh(db_sale)
        
        end_time = time.time()
        print(f"💰 Sale created successfully in {end_time - start_time:.3f}s - Total: PKR {total_price}")
        
        # Send SMS notification for card payments with improved bank-style formatting
        if sale.payment_method == "card" and customer:
            try:
                items_text = format_items_for_sms(sale_items, products)
                # Improved bank-style SMS format
                message = f"DEBIT\nCafe D Revenue\nPKR {total_price:.2f}\nBal: PKR {customer.balance:.2f}\n{items_text}"
                sms_service.send_sms(customer.phone, message)
            except Exception as e:
                print(f"Failed to send payment SMS: {str(e)}")
        
        return SaleResponse(
            id=db_sale.id,
            total_price=db_sale.total_price,
            payment_method=db_sale.payment_method,
            is_settled=db_sale.is_settled,
            timestamp=db_sale.timestamp.isoformat() if db_sale.timestamp else "",
            room_no=db_sale.room_no,
            customer_id=db_sale.customer_id,
            items=[SaleItemResponse(**item) for item in db_sale.items] if db_sale.items else [],
            payments=db_sale.payments if db_sale.payments else []
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating sale: {str(e)}")

@router.get("/reports/pending", response_model=List[SaleResponse])
async def get_pending_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all pending sales."""
    pending_sales = db.query(Sale).filter(Sale.is_settled == False).all()
    return [
        SaleResponse(
            id=sale.id,
            total_price=sale.total_price,
            payment_method=sale.payment_method,
            is_settled=sale.is_settled,
            timestamp=sale.timestamp.isoformat() if sale.timestamp else "",
            room_no=sale.room_no,
            customer_id=sale.customer_id,
            items=[SaleItemResponse(**item) for item in sale.items] if sale.items else [],
            payments=sale.payments if sale.payments else []
        )
        for sale in pending_sales
    ]

@router.get("/pending")
async def get_pending_sales_summary(
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get pending sales summary for a customer or all customers."""
    query = db.query(Sale).filter(Sale.is_settled == False)
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)
    
    pending_sales = query.all()
    total_pending = sum(sale.total_price for sale in pending_sales)
    
    return {
        "total_pending_amount": total_pending,
        "pending_sales_count": len(pending_sales),
        "sales": [sale.id for sale in pending_sales]
    }

@router.put("/{sale_id}/settle", response_model=SaleResponse)
async def settle_sale(
    sale_id: int,
    settle_data: SettleSaleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Settle a pending sale with enhanced validation."""
    try:
        # Validate payment method
        valid_payment_methods = ["cash", "card", "easypaisa"]
        if settle_data.payment_method not in valid_payment_methods:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid payment method. Must be one of: {valid_payment_methods}"
            )
        
        # Get the sale with validation
        sale = db.query(Sale).filter(Sale.id == sale_id).first()
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        if sale.is_settled:
            raise HTTPException(
                status_code=400, 
                detail=f"Sale #{sale_id} is already settled with {sale.payment_method}"
            )
        
        # Validate customer exists and get current balance (only if customer_id provided)
        customer = None
        if settle_data.customer_id:
            customer = db.query(Customer).filter(Customer.id == settle_data.customer_id).first()
            if not customer:
                raise HTTPException(status_code=400, detail="Customer not found")
        
        # Ensure the sale belongs to the specified customer (if customer provided)
        if settle_data.customer_id and sale.customer_id != settle_data.customer_id:
            raise HTTPException(
                status_code=400, 
                detail=f"Sale #{sale_id} belongs to customer #{sale.customer_id}, not #{settle_data.customer_id}"
            )
        
        # For card payments, validate customer balance (customer must be provided)
        if settle_data.payment_method == "card":
            if not customer:
                raise HTTPException(status_code=400, detail="Customer is required for card payments")
            if customer.balance < sale.total_price:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient balance. Customer balance: PKR {customer.balance:.2f}, Sale total: PKR {sale.total_price:.2f}. Shortfall: PKR {sale.total_price - customer.balance:.2f}"
                )
            
            # Deduct from customer balance
            customer.balance -= sale.total_price
            print(f"💳 Card payment: Deducted PKR {sale.total_price:.2f} from customer #{customer.id}. New balance: PKR {customer.balance:.2f}")
        
        # Update sale with settlement information
        sale.payment_method = settle_data.payment_method
        sale.is_settled = True
        
        # Add settlement metadata to payments
        settlement_record = {
            "method": settle_data.payment_method,
            "amount": sale.total_price,
            "settled_by": current_user.username,
            "settled_at": time.time()
        }
        
        if sale.payments:
            sale.payments.append(settlement_record)
        else:
            sale.payments = [settlement_record]
        
        db.commit()
        db.refresh(sale)
        
        print(f"✅ Sale #{sale_id} settled successfully with {settle_data.payment_method} for PKR {sale.total_price:.2f}")
        
        # Send SMS notification for card payments with improved bank-style formatting
        if settle_data.payment_method == "card" and customer:
            try:
                # Get products for SMS formatting
                product_ids = [item["product_id"] for item in sale.items]
                products = db.query(Product).filter(Product.id.in_(product_ids)).all()
                items_text = format_items_for_sms(sale.items, products)
                # Improved bank-style SMS format
                message = f"DEBIT\nCafe D Revenue\nBill #{sale_id} Settled\nPKR {sale.total_price:.2f}\nBal: PKR {customer.balance:.2f}\n{items_text}"
                sms_service.send_sms(customer.phone, message)
            except Exception as e:
                print(f"Failed to send settlement SMS: {str(e)}")
        
        return SaleResponse(
            id=sale.id,
            total_price=sale.total_price,
            payment_method=sale.payment_method,
            is_settled=sale.is_settled,
            timestamp=sale.timestamp.isoformat() if sale.timestamp else "",
            room_no=sale.room_no,
            customer_id=sale.customer_id,
            items=[SaleItemResponse(**item) for item in sale.items] if sale.items else [],
            payments=sale.payments if sale.payments else []
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error settling sale: {str(e)}")
    
    return SaleResponse(
        id=sale.id,
        total_price=sale.total_price,
        payment_method=sale.payment_method,
        is_settled=sale.is_settled,
        timestamp=sale.timestamp.isoformat() if sale.timestamp else "",
        room_no=sale.room_no,
        customer_id=sale.customer_id,
        items=[SaleItemResponse(**item) for item in sale.items] if sale.items else [],
        payments=sale.payments if sale.payments else []
    )

@router.post("/settle-batch", response_model=BatchSettleResponse)
async def batch_settle_sales(
    batch_request: BatchSettleSaleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Settle multiple pending sales in batch with comprehensive validation."""
    if not batch_request.sale_ids:
        raise HTTPException(status_code=400, detail="No sale IDs provided")
    
    if len(batch_request.sale_ids) > 50:
        raise HTTPException(status_code=400, detail="Cannot settle more than 50 sales at once")
    
    # Validate payment method
    valid_payment_methods = ["cash", "card", "easypaisa"]
    if batch_request.payment_method not in valid_payment_methods:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid payment method. Must be one of: {valid_payment_methods}"
        )
    
    settled_sales = []
    failed_sales = []
    total_settled_amount = 0.0
    
    # For card payments, pre-validate all customer balances
    if batch_request.payment_method == "card":
        customer_balances = {}
        customer_required = {}
        
        for sale_id in batch_request.sale_ids:
            sale = db.query(Sale).filter(Sale.id == sale_id).first()
            if sale and not sale.is_settled:
                customer_id = sale.customer_id
                if customer_id not in customer_balances:
                    customer = db.query(Customer).filter(Customer.id == customer_id).first()
                    if customer:
                        customer_balances[customer_id] = customer.balance
                        customer_required[customer_id] = 0
                
                if customer_id in customer_required:
                    customer_required[customer_id] += sale.total_price
        
        # Check if any customer has insufficient balance for all their sales
        for customer_id, required in customer_required.items():
            if customer_balances.get(customer_id, 0) < required:
                balance = customer_balances.get(customer_id, 0)
                # Fail all sales for this customer
                for sale_id in batch_request.sale_ids:
                    sale = db.query(Sale).filter(Sale.id == sale_id).first()
                    if sale and sale.customer_id == customer_id and not sale.is_settled:
                        failed_sales.append({
                            "sale_id": sale_id, 
                            "error": f"Insufficient balance for customer #{customer_id}. Balance: PKR {balance:.2f}, Total required: PKR {required:.2f}"
                        })
    
    # Process each sale
    for sale_id in batch_request.sale_ids:
        # Skip if already failed in pre-validation
        if any(f["sale_id"] == sale_id for f in failed_sales):
            continue
        
        try:
            # Get the sale
            sale = db.query(Sale).filter(Sale.id == sale_id).first()
            if not sale:
                failed_sales.append({"sale_id": sale_id, "error": "Sale not found"})
                continue
                
            if sale.is_settled:
                failed_sales.append({"sale_id": sale_id, "error": f"Sale is already settled with {sale.payment_method}"})
                continue
            
            # For card payments, deduct from customer balance
            if batch_request.payment_method == "card":
                customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
                if not customer:
                    failed_sales.append({"sale_id": sale_id, "error": "Customer not found"})
                    continue
                
                if customer.balance < sale.total_price:
                    failed_sales.append({
                        "sale_id": sale_id, 
                        "error": f"Insufficient balance. Customer balance: PKR {customer.balance:.2f}, Sale total: PKR {sale.total_price:.2f}"
                    })
                    continue
                
                # Deduct from customer balance
                customer.balance -= sale.total_price
            
            # Update sale with settlement information
            sale.payment_method = batch_request.payment_method
            sale.is_settled = True
            
            # Add settlement metadata
            settlement_record = {
                "method": batch_request.payment_method,
                "amount": sale.total_price,
                "settled_by": current_user.username,
                "settled_at": time.time(),
                "batch_settlement": True
            }
            
            if sale.payments:
                sale.payments.append(settlement_record)
            else:
                sale.payments = [settlement_record]
            
            settled_sales.append(sale_id)
            total_settled_amount += sale.total_price
            
        except Exception as e:
            failed_sales.append({"sale_id": sale_id, "error": f"Processing error: {str(e)}"})
    
    # Commit all successful settlements
    try:
        if settled_sales:
            db.commit()
            print(f"✅ Batch settlement completed: {len(settled_sales)} sales settled for PKR {total_settled_amount:.2f} via {batch_request.payment_method}")
            
            # Send SMS notifications for card payments with improved bank-style formatting
            if batch_request.payment_method == "card":
                # Get all settled sales with customer info
                settled_sale_records = db.query(Sale).filter(Sale.id.in_(settled_sales)).all()
                for sale in settled_sale_records:
                    if sale.customer_id:
                        customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
                        if customer:
                            try:
                                # Get products for SMS formatting
                                product_ids = [item["product_id"] for item in sale.items]
                                products = db.query(Product).filter(Product.id.in_(product_ids)).all()
                                items_text = format_items_for_sms(sale.items, products)
                                # Improved bank-style SMS format
                                message = f"DEBIT\nCafe D Revenue\nBill #{sale.id} Settled\nPKR {sale.total_price:.2f}\nBal: PKR {customer.balance:.2f}\n{items_text}"
                                sms_service.send_sms(customer.phone, message)
                            except Exception as e:
                                print(f"Failed to send batch settlement SMS: {str(e)}")
        else:
            db.rollback()
            print("⚠️ Batch settlement: No sales were settled")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error committing batch settlement: {str(e)}")
    
    return BatchSettleResponse(
        settled_count=len(settled_sales),
        failed_count=len(failed_sales),
        settled_sales=settled_sales,
        failed_sales=failed_sales
    )

@router.post("/recharge", response_model=RechargeResponse, status_code=status.HTTP_201_CREATED)
async def recharge_customer(
    recharge: RechargeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recharge customer balance."""
    customer = db.query(Customer).filter(Customer.id == recharge.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if recharge.amount <= 0:
        raise HTTPException(status_code=400, detail="Recharge amount must be positive")
    
    # Update customer balance
    old_balance = customer.balance
    customer.balance += recharge.amount
    
    # Create recharge transaction record
    recharge_transaction = RechargeTransaction(
        customer_id=recharge.customer_id,
        amount=recharge.amount
    )
    
    db.add(recharge_transaction)
    db.commit()
    db.refresh(recharge_transaction)
    
    # Send SMS notification for recharge with improved bank-style formatting
    try:
        message = f"CREDIT\nCafe D Revenue\nPKR {recharge.amount:.2f}\nBal: PKR {customer.balance:.2f}\nRecharge successful!"
        sms_service.send_sms(customer.phone, message)
        
        # Check for low balance after recharge (if balance is still low)
        if customer.balance < 100:  # Threshold for low balance alert
            low_balance_message = f"LOW BALANCE ALERT\nCafe D Revenue\nCurrent Bal: PKR {customer.balance:.2f}\nPlease recharge your card soon."
            sms_service.send_sms(customer.phone, low_balance_message)
    except Exception as e:
        print(f"Failed to send recharge SMS: {str(e)}")
    
    return RechargeResponse(
        id=recharge_transaction.id,
        customer_id=recharge_transaction.customer_id,
        amount=recharge_transaction.amount,
        recharge_date=recharge_transaction.recharge_date.isoformat() if recharge_transaction.recharge_date else ""
    )

@router.get("/recharge", response_model=List[RechargeResponse])
async def get_all_recharges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_manager_user)
):
    """Get all recharge transactions."""
    recharges = db.query(RechargeTransaction).order_by(
        RechargeTransaction.recharge_date.desc()
    ).all()
    
    return [
        RechargeResponse(
            id=recharge.id,
            customer_id=recharge.customer_id,
            amount=recharge.amount,
            recharge_date=recharge.recharge_date.isoformat() if recharge.recharge_date else ""
        )
        for recharge in recharges
    ]

@router.get("/recharge/history/{customer_id}", response_model=List[RechargeResponse])
async def get_recharge_history(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recharge history for a customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    recharges = db.query(RechargeTransaction).filter(
        RechargeTransaction.customer_id == customer_id
    ).order_by(RechargeTransaction.recharge_date.desc()).all()
    
    return [
        RechargeResponse(
            id=recharge.id,
            customer_id=recharge.customer_id,
            amount=recharge.amount,
            recharge_date=recharge.recharge_date.isoformat() if recharge.recharge_date else ""
        )
        for recharge in recharges
    ]