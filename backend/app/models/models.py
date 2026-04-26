from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Boolean, Text, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid
import random
import string
from app.db.session import Base

class OrderStatus(str, enum.Enum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STAFF = "staff"
    CUSTOMER = "customer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default=UserRole.ADMIN)
    reset_token = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    image_url = Column(String)
    is_active = Column(Boolean, default=True)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    customer_name = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False, index=True)
    address = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Optional link to customer account
    status = Column(String, default=OrderStatus.PENDING, index=True)
    is_unseen = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship("OrderItem", back_populates="order")

    # Indexing for performance
    __table_args__ = (
        Index('idx_order_status_created', 'status', 'created_at'),
    )

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    email_status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SiteContent(Base):
    __tablename__ = "site_content"
    id = Column(Integer, primary_key=True, index=True)
    section = Column(String, unique=True, index=True) # e.g., 'hero', 'benefits'
    title = Column(String)
    subtitle = Column(Text)
    data = Column(JSON) # For list items or complex data
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

def generate_order_number():
    prefix = "NUT"
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{random_str}"
