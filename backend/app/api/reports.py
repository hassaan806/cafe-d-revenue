from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date

from ..db.database import get_db
from ..models.sales import Sale
from ..models.product import Product
from ..models.customer import Customer
from ..models.user import User
from ..api.auth import get_current_user, get_admin_or_manager_user

# Pydantic models
class DateRangeRequest(BaseModel):
    from_date: date
    to_date: date

class SalesReportResponse(BaseModel):
    date: str
    total_sales: float
    transaction_count: int
    average_order_value: float

class ProductSalesResponse(BaseModel):
    product_id: int
    product_name: str
    quantity_sold: int
    total_revenue: float
    percentage_of_total: float

class PaymentMethodResponse(BaseModel):
    payment_method: str
    transaction_count: int
    total_amount: float
    percentage_of_total: float

router = APIRouter()

@router.get("/sales-by-date")
async def get_sales_by_date(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_manager_user)
):
    """Get sales grouped by date."""
    try:
        # Default to last 30 days if no dates provided
        if not from_date or not to_date:
            from datetime import timedelta
            today = datetime.now().date()
            from_date = (today - timedelta(days=30)).isoformat()
            to_date = today.isoformat()
        
        # Query sales grouped by date
        query = text("""
            SELECT 
                DATE(timestamp) as sale_date,
                COUNT(*) as transaction_count,
                SUM(total_price) as total_sales,
                AVG(total_price) as average_order_value
            FROM sales 
            WHERE DATE(timestamp) BETWEEN :from_date AND :to_date
            AND is_settled = TRUE
            GROUP BY DATE(timestamp)
            ORDER BY DATE(timestamp) DESC
        """)
        
        result = db.execute(query, {"from_date": from_date, "to_date": to_date})
        rows = result.fetchall()
        
        sales_by_date = [
            {
                "date": row[0],
                "transaction_count": row[1],
                "total_sales": float(row[2]) if row[2] else 0.0,
                "average_order_value": float(row[3]) if row[3] else 0.0
            }
            for row in rows
        ]
        
        return {
            "date_range": f"{from_date} to {to_date}",
            "total_days": len(sales_by_date),
            "sales_by_date": sales_by_date,
            "summary": {
                "total_sales": sum(day["total_sales"] for day in sales_by_date),
                "total_transactions": sum(day["transaction_count"] for day in sales_by_date),
                "average_daily_sales": sum(day["total_sales"] for day in sales_by_date) / len(sales_by_date) if sales_by_date else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating sales by date report: {str(e)}")

@router.get("/sales-by-product")
async def get_sales_by_product(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_manager_user)
):
    """Get sales grouped by product."""
    try:
        # Default to last 30 days if no dates provided
        if not from_date or not to_date:
            from datetime import timedelta
            today = datetime.now().date()
            from_date = (today - timedelta(days=30)).isoformat()
            to_date = today.isoformat()
        
        # Get all sales in date range
        sales = db.query(Sale).filter(
            func.date(Sale.timestamp) >= from_date,
            func.date(Sale.timestamp) <= to_date,
            Sale.is_settled == True
        ).all()
        
        # Process product sales from JSON items
        product_sales = {}
        total_revenue = 0
        
        for sale in sales:
            if sale.items:
                for item in sale.items:
                    product_id = item.get('product_id')
                    quantity = item.get('quantity', 0)
                    
                    # Get product info
                    product = db.query(Product).filter(Product.id == product_id).first()
                    product_name = product.name if product else f"Product {product_id}"
                    product_price = product.price if product else 0
                    
                    item_total = quantity * product_price
                    total_revenue += item_total
                    
                    if product_id not in product_sales:
                        product_sales[product_id] = {
                            "product_id": product_id,
                            "product_name": product_name,
                            "quantity_sold": 0,
                            "total_revenue": 0.0
                        }
                    
                    product_sales[product_id]["quantity_sold"] += quantity
                    product_sales[product_id]["total_revenue"] += item_total
        
        # Calculate percentages and sort by revenue
        product_list = []
        for product_data in product_sales.values():
            percentage = (product_data["total_revenue"] / total_revenue * 100) if total_revenue > 0 else 0
            product_data["percentage_of_total"] = round(percentage, 2)
            product_list.append(product_data)
        
        product_list.sort(key=lambda x: x["total_revenue"], reverse=True)
        
        return {
            "date_range": f"{from_date} to {to_date}",
            "total_products": len(product_list),
            "products": product_list,
            "summary": {
                "total_revenue": total_revenue,
                "total_quantity_sold": sum(p["quantity_sold"] for p in product_list)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating sales by product report: {str(e)}")

@router.get("/payment-breakdown")
async def get_payment_breakdown(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_manager_user)
):
    """Get payment method breakdown."""
    try:
        # Default to last 30 days if no dates provided
        if not from_date or not to_date:
            from datetime import timedelta
            today = datetime.now().date()
            from_date = (today - timedelta(days=30)).isoformat()
            to_date = today.isoformat()
        
        # Query payment method breakdown
        query = text("""
            SELECT 
                payment_method,
                COUNT(*) as transaction_count,
                SUM(total_price) as total_amount
            FROM sales 
            WHERE DATE(timestamp) BETWEEN :from_date AND :to_date
            AND is_settled = TRUE
            GROUP BY payment_method
            ORDER BY total_amount DESC
        """)
        
        result = db.execute(query, {"from_date": from_date, "to_date": to_date})
        rows = result.fetchall()
        
        total_amount = sum(float(row[2]) for row in rows if row[2])
        
        payment_methods = [
            {
                "payment_method": row[0],
                "transaction_count": row[1],
                "total_amount": float(row[2]) if row[2] else 0.0,
                "percentage_of_total": round((float(row[2]) / total_amount * 100) if total_amount > 0 else 0, 2)
            }
            for row in rows
        ]
        
        return {
            "date_range": f"{from_date} to {to_date}",
            "payment_methods": payment_methods,
            "summary": {
                "total_amount": total_amount,
                "total_transactions": sum(pm["transaction_count"] for pm in payment_methods)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating payment breakdown report: {str(e)}")

@router.get("/sales-summary")
async def get_sales_summary(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_manager_user)
):
    """Get comprehensive sales summary."""
    try:
        # Default to last 30 days if no dates provided
        if not from_date or not to_date:
            from datetime import timedelta
            today = datetime.now().date()
            from_date = (today - timedelta(days=30)).isoformat()
            to_date = today.isoformat()
        
        # Get basic sales metrics
        settled_sales = db.query(Sale).filter(
            func.date(Sale.timestamp) >= from_date,
            func.date(Sale.timestamp) <= to_date,
            Sale.is_settled == True
        ).all()
        
        pending_sales = db.query(Sale).filter(
            func.date(Sale.timestamp) >= from_date,
            func.date(Sale.timestamp) <= to_date,
            Sale.is_settled == False
        ).all()
        
        total_revenue = sum(sale.total_price for sale in settled_sales)
        pending_amount = sum(sale.total_price for sale in pending_sales)
        
        return {
            "date_range": f"{from_date} to {to_date}",
            "settled_sales": {
                "count": len(settled_sales),
                "total_amount": total_revenue,
                "average_order_value": total_revenue / len(settled_sales) if settled_sales else 0
            },
            "pending_sales": {
                "count": len(pending_sales),
                "total_amount": pending_amount
            },
            "overall": {
                "total_transactions": len(settled_sales) + len(pending_sales),
                "total_gross_sales": total_revenue + pending_amount,
                "settlement_rate": (len(settled_sales) / (len(settled_sales) + len(pending_sales)) * 100) if (settled_sales or pending_sales) else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating sales summary: {str(e)}")