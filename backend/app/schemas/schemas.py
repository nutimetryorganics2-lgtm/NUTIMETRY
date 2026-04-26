from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime
import uuid

# Helper for MongoDB ObjectId
from pydantic import BeforeValidator
from typing import Annotated

PyObjectId = Annotated[str, BeforeValidator(str)]

class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=2)
    phone: str = Field(..., pattern=r'^\d{10}$', description="Phone number must be exactly 10 digits")
    village: str
    district: str
    state: str
    address: str
    pincode: str = Field(..., pattern=r'^\d{6}$', description="Pincode must be exactly 6 digits")
    is_default: bool = False

class UnifiedLogin(BaseModel):
    phone: Optional[str] = Field(None, pattern=r'^\d{10}$')
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=6)

class FarmerRegister(BaseModel):
    name: str
    phone: str = Field(..., pattern=r'^\d{10}$', description="Phone number must be exactly 10 digits")
    password: str
    village: str
    district: str
    state: str
    address: str
    pincode: str

class UserProfile(BaseModel):
    id: str
    role: str
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    addresses: List[Address] = []

class Token(BaseModel):
    access_token: str
    token_type: str

# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    stock: int
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: PyObjectId = Field(default=None, alias="_id")
    is_active: bool = True

    class Config:
        populate_by_name = True
        json_encoders = {str: str}

# Order Schemas
class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int

class OrderCreate(BaseModel):
    customer_name: Optional[str] = None
    phone: Optional[str] = Field(None, pattern=r'^\d{10}$', description="Phone number must be exactly 10 digits")
    address: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate]
    idempotency_key: Optional[str] = None
    selected_address_id: Optional[str] = None

class OrderItemResponse(BaseModel):
    product_id: str
    name: str
    quantity: int
    price_at_purchase: float

class OrderStatusHistory(BaseModel):
    status: str
    timestamp: datetime

class OrderResponse(BaseModel):
    id: PyObjectId = Field(default=None, alias="_id")
    order_id: str
    customer_name: str
    phone: str
    village: Optional[str] = None
    address: str
    notes: Optional[str] = None
    status: str
    status_history: List[OrderStatusHistory] = []
    is_seen: bool = False
    email_status: str = "pending"
    retry_count: int = 0
    last_email_attempt: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemResponse]

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

# Content Schema
class ContentUpdate(BaseModel):
    section: str
    data: dict

# Enquiry Schemas
class EnquiryCreate(BaseModel):
    name: str
    phone: str
    message: str

class EnquiryResponse(EnquiryCreate):
    id: PyObjectId = Field(default=None, alias="_id")
    is_resolved: bool
    email_status: str = "pending"
    created_at: datetime

    class Config:
        populate_by_name = True
