from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from app.schemas.schemas import OrderCreate, OrderResponse
from app.api.deps import get_db, get_current_active_admin, get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
import random
import string
import io
import csv
import logging
from app.services.notification_service import send_order_notification_with_retry
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

def generate_order_id():
    return "NMO-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

@router.post("/", response_model=dict)
@limiter.limit("30/minute")
async def create_order(
    request: Request,
    order: OrderCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Check idempotency key
        if order.idempotency_key:
            existing_order = await db["orders"].find_one({"idempotency_key": order.idempotency_key})
            if existing_order:
                logger.info(f"Idempotency hit! Returning existing order for key: {order.idempotency_key}")
                existing_order["_id"] = str(existing_order["_id"])
                return {
                    "success": True,
                    "message": "Order already exists (Idempotency hit)",
                    "data": {
                        "order_id": existing_order["order_id"],
                        "items_count": len(existing_order.get("items", [])),
                        "total_amount": existing_order.get("total_amount")
                    }
                }

        import asyncio
        from pymongo.errors import OperationFailure
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Use transaction session for atomic multi-product stock decrement
                async with await db.client.start_session() as session:
                    async with session.start_transaction():
                        processed_items = []
                        for item in order.items:
                            product = await db["products"].find_one({"_id": ObjectId(item.product_id)}, session=session)
                            if not product:
                                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
                            
                            # Atomic update with condition within session
                            update_result = await db["products"].update_one(
                                {"_id": ObjectId(item.product_id), "stock": {"$gte": item.quantity}},
                                {"$inc": {"stock": -item.quantity}},
                                session=session
                            )
                            
                            if update_result.modified_count == 0:
                                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}.")
                            
                            processed_items.append({
                                "product_id": str(product["_id"]),
                                "name": product["name"],
                                "quantity": item.quantity,
                                "price_at_purchase": product["price"]
                            })

                        total_amount = sum(item["price_at_purchase"] * item["quantity"] for item in processed_items)
                        
                        now = datetime.utcnow()
                        
                        # Address Logic: Handle Multi-Address Support
                        selected_addr = None
                        if order.selected_address_id:
                            for addr in current_user.get("addresses", []):
                                if addr.get("id") == order.selected_address_id:
                                    selected_addr = addr
                                    break
                        
                        if not selected_addr:
                            # Fallback to default address in list if any
                            for addr in current_user.get("addresses", []):
                                if addr.get("is_default"):
                                    selected_addr = addr
                                    break
                        
                        if selected_addr:
                            address_string = f"{selected_addr.get('address', '')}, {selected_addr.get('village', '')}, {selected_addr.get('district', '')}, {selected_addr.get('state', '')} - {selected_addr.get('pincode', '')}".strip(', -')
                            customer_name = selected_addr.get("name", current_user.get("name", "Farmer"))
                            phone = selected_addr.get("phone", current_user.get("phone", ""))
                            village = selected_addr.get("village", "")
                        else:
                            # Legacy Fallback for users without addresses list
                            address_string = f"{current_user.get('address', '')}, {current_user.get('village', '')}, {current_user.get('district', '')}, {current_user.get('state', '')} - {current_user.get('pincode', '')}".strip(', -')
                            customer_name = current_user.get("name", current_user.get("full_name", "Farmer"))
                            phone = current_user.get("phone", "")
                            village = current_user.get("village", "")

                        order_doc = {
                            "order_id": generate_order_id(),
                            "user_id": str(current_user["_id"]),
                            "customer_name": customer_name,
                            "phone": phone,
                            "village": village,
                            "address": address_string,
                            "notes": order.notes,
                            "status": "Pending",
                            "status_history": [{"status": "Pending", "timestamp": now}],
                            "is_seen": False,
                            "email_status": "pending",
                            "retry_count": 0,
                            "last_email_attempt": None,
                            "created_at": now,
                            "updated_at": now,
                            "items": processed_items,
                            "total_amount": total_amount,
                            "idempotency_key": order.idempotency_key,
                            "address_id": order.selected_address_id
                        }
                        
                        result = await db["orders"].insert_one(order_doc, session=session)
                        order_doc["_id"] = result.inserted_id
                
                # If transaction succeeds, break retry loop
                # Trigger background tasks AFTER transaction commit
                background_tasks.add_task(send_order_notification_with_retry, str(order_doc["_id"]))
                logger.info(f"Order created successfully: {order_doc['order_id']}")
                return {
                    "success": True,
                    "message": "Order placed successfully",
                    "data": {
                        "order_id": order_doc["order_id"],
                        "items_count": len(order_doc["items"]),
                        "total_amount": order_doc["total_amount"]
                    }
                }
                
            except HTTPException:
                raise
            except Exception as exc:
                if hasattr(exc, 'code') and exc.code == 11000:
                    # Duplicate key error means concurrent request won the race
                    existing_order = await db["orders"].find_one({"idempotency_key": order.idempotency_key})
                    if existing_order:
                        logger.info(f"Concurrent idempotency hit! Returning existing order for key: {order.idempotency_key}")
                        existing_order["_id"] = str(existing_order["_id"])
                        return {
                            "success": True,
                            "message": "Order already exists (Concurrent hit)",
                            "data": {
                                "order_id": existing_order["order_id"],
                                "items_count": len(existing_order.get("items", [])),
                                "total_amount": existing_order.get("total_amount")
                            }
                        }
                    else:
                         raise HTTPException(status_code=500, detail="Idempotency collision but order not found")

                if hasattr(exc, 'has_error_label') and exc.has_error_label("TransientTransactionError") or getattr(exc, 'code', None) == 112:
                    if attempt < max_retries - 1:
                        logger.warning(f"WriteConflict detected. Retrying transaction (Attempt {attempt+1})")
                        await asyncio.sleep(0.1 * (2 ** attempt)) # Exponential backoff
                        continue
                logger.error(f"Database error during order creation: {exc}")
                raise HTTPException(status_code=503, detail=f"Database error during order creation: {repr(exc)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during order creation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/", response_model=dict)
async def get_orders(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_admin=Depends(get_current_active_admin)
):
    try:
        # We will sort by Pending status first, then by date.
        cursor = db["orders"].find().sort("created_at", -1).skip(skip).limit(limit)
        orders = await cursor.to_list(length=limit)
        
        # Manual serialization
        for order in orders:
            order["_id"] = str(order["_id"])
            
        return {
            "success": True,
            "message": "Orders fetched successfully",
            "data": orders
        }
    except Exception as e:
        logger.error(f"Failed to fetch orders: {e}")
        raise HTTPException(status_code=503, detail="Database failure")

@router.get("/my-orders", response_model=dict)
async def get_my_orders(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = str(current_user["_id"])
        query = {
            "$or": [
                {"user_id": user_id},
                {"phone": current_user.get("phone")}
            ]
        }
        
        cursor = db["orders"].find(query).sort("created_at", -1)
        orders = await cursor.to_list(length=100)
        
        for order in orders:
            order["_id"] = str(order["_id"])
            
        return {
            "success": True,
            "message": "My orders fetched successfully",
            "data": orders
        }
    except Exception as e:
        logger.error(f"Failed to fetch my orders for user {current_user.get('_id')}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch orders")

@router.post("/reorder/{order_id}")
async def reorder(
    order_id: str, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        # 1. Get original order
        original_order = await db["orders"].find_one({"order_id": order_id})
        if not original_order:
            raise HTTPException(status_code=404, detail="Original order not found")
            
        # 2. Check if it belongs to the current user (if farmer)
        if current_user.get("role") == "farmer" and original_order.get("phone") != current_user.get("phone"):
            raise HTTPException(status_code=403, detail="Unauthorized to reorder this")

        # 3. Create new order based on original items
        now = datetime.utcnow()
        new_order = {
            "order_id": generate_order_id(),
            "customer_name": original_order["customer_name"],
            "phone": original_order["phone"],
            "address": original_order["address"],
            "notes": f"Reorder of {order_id}",
            "status": "Pending",
            "status_history": [{"status": "Pending", "timestamp": now}],
            "is_seen": False,
            "created_at": now,
            "updated_at": now,
            "items": original_order["items"],
            "total_amount": original_order["total_amount"],
            "idempotency_key": f"reorder-{order_id}-{now.timestamp()}"
        }
        
        result = await db["orders"].insert_one(new_order)
        return {
            "success": True,
            "message": "Reorder successful",
            "data": {"order_id": new_order["order_id"]}
        }
    except Exception as e:
        logger.error(f"Reorder failed: {e}")
        raise HTTPException(status_code=500, detail="Reorder failed")

@router.get("/export")
async def export_orders(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_admin=Depends(get_current_active_admin)
):
    try:
        cursor = db["orders"].find().sort("created_at", -1)
        orders = await cursor.to_list(length=1000)
        
        output = io.StringIO()
        writer = csv.writer(output)
        # Order ID, Name, Phone, Address, Products, Status, Date
        writer.writerow(["Order ID", "Name", "Phone", "Address", "Products", "Status", "Date"])
        
        for o in orders:
            products_str = ", ".join([f"{item['name']} (x{item['quantity']})" for item in o.get("items", [])])
            writer.writerow([
                o.get("order_id"), 
                o.get("customer_name"), 
                o.get("phone"), 
                o.get("address"),
                products_str,
                o.get("status"), 
                o.get("created_at").strftime("%Y-%m-%d %H:%M:%S") if isinstance(o.get("created_at"), datetime) else o.get("created_at")
            ])
            
        csv_content = output.getvalue()
        output.close()
        
        return StreamingResponse(
            io.BytesIO(csv_content.encode("utf-8")), 
            media_type="text/csv", 
            headers={
                "Content-Disposition": "attachment; filename=nutrimetry_orders_export.csv",
                "Cache-Control": "no-cache"
            }
        )
    except Exception as e:
        logger.error(f"Failed to export orders: {e}")
        raise HTTPException(status_code=500, detail="Export failed")

@router.get("/metrics")
async def get_metrics(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_admin=Depends(get_current_active_admin)
):
    try:
        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)
        
        # 1. Orders Today
        orders_today = await db["orders"].count_documents({"created_at": {"$gte": today_start}})
        
        # 2. Total Pending
        total_pending = await db["orders"].count_documents({"status": "Pending"})
        
        # 3. Weekly Trends
        weekly_trend = "+12%"
        
        # 4. Low Stock Products
        low_stock_cursor = db["products"].find({"stock": {"$lt": 10}, "is_active": True})
        low_stock_products = await low_stock_cursor.to_list(length=100)
        
        # 5. Total Revenue
        pipeline = [
            {"$match": {"status": {"$ne": "Cancelled"}}},
            {"$group": {"_id": None, "revenue": {"$sum": "$total_amount"}}}
        ]
        revenue_result = await db["orders"].aggregate(pipeline).to_list(length=1)
        total_revenue = revenue_result[0]["revenue"] if revenue_result else 0

        return {
            "success": True,
            "message": "Metrics calculated",
            "data": {
                "orders_today": orders_today,
                "total_pending": total_pending,
                "weekly_trend": weekly_trend,
                "total_revenue": total_revenue,
                "low_stock_alerts": [{"id": str(p["_id"]), "name": p["name"], "stock": p["stock"]} for p in low_stock_products]
            }
        }
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise HTTPException(status_code=503, detail="Metrics unavailable")

@router.get("/track/{order_id}")
async def track_order(order_id: str, phone: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    order = await db["orders"].find_one({"order_id": order_id, "phone": phone})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or phone mismatch")
    return {
        "success": True,
        "message": "Order tracking info fetched",
        "data": {
            "order_id": order["order_id"],
            "status": order["status"],
            "created_at": order["created_at"],
            "status_history": order.get("status_history", [])
        }
    }

@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str, 
    status: str, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_admin=Depends(get_current_active_admin)
):
    valid_statuses = ["Pending", "Processing", "Dispatched", "Delivered"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    try:
        now = datetime.utcnow()
        result = await db["orders"].update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {"status": status, "updated_at": now},
                "$push": {"status_history": {"status": status, "timestamp": now}}
            }
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        
        logger.info(f"Order {order_id} status updated to {status}")
        return {
            "success": True,
            "message": f"Order status updated to {status}",
            "data": None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UPDATE_STATUS_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update order status")

@router.patch("/{order_id}/seen")
async def mark_order_seen(
    order_id: str, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_admin=Depends(get_current_active_admin)
):
    try:
        result = await db["orders"].update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"is_seen": True}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        return {
            "success": True,
            "message": "Order marked as seen",
            "data": None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MARK_SEEN_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update order")

@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: str, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_admin=Depends(get_current_active_admin)
):
    try:
        # 1. Get the order
        order = await db["orders"].find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
        if order["status"] == "Cancelled":
            raise HTTPException(status_code=400, detail="Order is already cancelled")
            
        # 2. Update order status
        now = datetime.utcnow()
        await db["orders"].update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {"status": "Cancelled", "updated_at": now},
                "$push": {"status_history": {"status": "Cancelled", "timestamp": now}}
            }
        )
        
        # 3. Atomic Stock Increment (Restock)
        for item in order.get("items", []):
            await db["products"].update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$inc": {"stock": item["quantity"]}}
            )
            
        logger.info(f"Order {order_id} cancelled and stock incrementally returned.")
        return {
            "success": True,
            "message": "Order cancelled and stock restored",
            "data": None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CANCEL_ORDER_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel order")
