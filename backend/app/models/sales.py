from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.database import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    total_price = Column(Float, nullable=False)
    payment_method = Column(String(20), nullable=False)  # cash, card, easypaisa, pending
    is_settled = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    room_no = Column(String(20))
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    items = Column(JSON)  # Store sale items as JSON
    payments = Column(JSON, default=list)  # Store payment details as JSON

    # Relationship
    customer = relationship("Customer", backref="sales")

class RechargeTransaction(Base):
    __tablename__ = "recharge_transactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    recharge_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    customer = relationship("Customer", backref="recharge_transactions")