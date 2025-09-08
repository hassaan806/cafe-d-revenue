from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from ..db.database import get_db
from ..models.user import User
from ..models.sales import Sale
from ..models.customer import Customer
from ..models.product import Product
from ..api.auth import get_current_user, get_admin_or_manager_user

# Pydantic models for dashboard responses
class TrendData(BaseModel):
    date: str
    sales: float
    transactions: int

class CustomerInsight(BaseModel):
    id: int
    name: str
    total_spent: float
    transaction_count: int
    last_purchase: str

router = APIRouter()

@router.get("/trends")
async def get_dashboard_trends(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_manager_user)
):
    """Get sales trends for the last N days"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get daily sales data
        daily_sales = db.query(
            func.date(Sale.timestamp).label('date'),
            func.sum(Sale.total_price).label('total_sales'),
            func.count(Sale.id).label('transaction_count')
        ).filter(
            Sale.timestamp >= start_date,
            Sale.timestamp <= end_date,
            Sale.is_settled == True
        ).group_by(func.date(Sale.timestamp)).all()
        
        trends = []
        for day_data in daily_sales:
            trends.append(TrendData(
                date=day_data.date.strftime("%Y-%m-%d"),
                sales=float(day_data.total_sales or 0),
                transactions=day_data.transaction_count or 0
            ))
        
        return trends
    except Exception as e:
        return []

@router.get("/customers/insights")
async def get_customer_insights(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_manager_user)
):
    """Get top customer insights"""
    try:
        # Get top customers by total spent
        customer_sales = db.query(
            Customer.id,
            Customer.name,
            func.sum(Sale.total_price).label('total_spent'),
            func.count(Sale.id).label('transaction_count'),
            func.max(Sale.timestamp).label('last_purchase')
        ).join(Sale).filter(
            Sale.is_settled == True
        ).group_by(Customer.id, Customer.name).order_by(
            desc('total_spent')
        ).limit(limit).all()
        
        insights = []
        for customer_data in customer_sales:
            insights.append(CustomerInsight(
                id=customer_data.id,
                name=customer_data.name,
                total_spent=float(customer_data.total_spent or 0),
                transaction_count=customer_data.transaction_count or 0,
                last_purchase=customer_data.last_purchase.isoformat() if customer_data.last_purchase else ""
            ))
        
        return insights
    except Exception as e:
        return []