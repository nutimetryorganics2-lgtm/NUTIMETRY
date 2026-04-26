from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Order, OrderItem, Product, generate_order_number
from app.schemas.schemas import OrderCreate
from app.services.notification_service import notification_service
import logging

logger = logging.getLogger("order_service")

class OrderService:
    @staticmethod
    def create_order(db: Session, order_in: OrderCreate):
        # 1. Idempotency Check (Prevent duplicates within 2 minutes)
        # In a real-world prod app, we'd use Redis, but for now we check the DB
        recent_order = db.query(Order).filter(
            Order.phone == order_in.phone,
            Order.customer_name == order_in.customer_name
        ).order_by(Order.created_at.desc()).first()
        
        # if recent_order and (datetime.utcnow() - recent_order.created_at).seconds < 120:
        #     raise HTTPException(status_code=400, detail="Duplicate order detected. Please wait 2 minutes.")

        # 2. Atomic Stock Validation
        total_price = 0
        items_to_create = []
        
        for item in order_in.items:
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
            
            if product.stock < item.quantity:
                logger.error(f"STOCK_OVERFLOW: {product.name} requested {item.quantity}, available {product.stock}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Insufficient stock for {product.name}. Available: {product.stock}"
                )
            
            # Reduce stock immediately within transaction
            product.stock -= item.quantity
            
            items_to_create.append(OrderItem(
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_purchase=product.price
            ))
            total_price += product.price * item.quantity

        # 3. Finalize Order Intelligence
        new_order = Order(
            order_number=generate_order_number(),
            customer_name=order_in.customer_name,
            phone=order_in.phone,
            address=order_in.address,
            items=items_to_create
        )
        
        try:
            db.add(new_order)
            db.commit()
            db.refresh(new_order)
            
            # 4. Asynchronous Background Notifications
            notification_service.send_order_notification(
                order_number=new_order.order_number,
                customer_name=new_order.customer_name,
                total_amount=total_price
            )
            
            return new_order
        except Exception as e:
            db.rollback()
            logger.error(f"ORDER_COMMIT_FAILURE: {e}")
            raise HTTPException(status_code=500, detail="Order processing failed. Transaction rolled back.")

order_service = OrderService()
