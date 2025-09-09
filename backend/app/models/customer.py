from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from ..db.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    rfid_no = Column(String(50), unique=True, index=True, nullable=False)
    card_number = Column(String(50), unique=True, index=True, nullable=False)
    balance = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # Add card_discount field with proper default
    card_discount = Column(Float, default=0.0, nullable=False)