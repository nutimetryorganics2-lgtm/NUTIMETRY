from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings
import logging
import asyncio
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

logger = logging.getLogger(__name__)

conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.SMTP_USER or "no-reply@nutimetryorganic.com",
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_SERVER,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=bool(settings.SMTP_USER and settings.SMTP_PASSWORD),
    VALIDATE_CERTS=True
)

from app.db.session import get_database

async def send_order_notification_with_retry(order_id_str: str):
    """
    Sends an email notification with asynchronous retry logic.
    """
    db = get_database()
    max_retries = 3
    retry_delays = [0, 5, 15] # Seconds to wait before each attempt
    
    for attempt in range(max_retries):
        await asyncio.sleep(retry_delays[attempt])
        
        # Fetch latest order state
        order = await db["orders"].find_one({"_id": ObjectId(order_id_str)})
        if not order:
            logger.error(f"Cannot send email, order {order_id_str} not found in DB.")
            return

        # Update DB about the attempt
        now = datetime.utcnow()
        await db["orders"].update_one(
            {"_id": ObjectId(order_id_str)},
            {"$inc": {"retry_count": 1}, "$set": {"last_email_attempt": now}}
        )

        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning("SMTP credentials not configured. Mocking email failure.")
            break

        # Prepare data for email
        created_at_fmt = order.get("created_at").strftime("%Y-%m-%d %H:%M:%S UTC") if isinstance(order.get("created_at"), datetime) else str(order.get("created_at"))
        village = order.get("village", "N/A") # If not in order doc, we might need to get it from user doc, but let's check address
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap');
                @media only screen and (max-width: 600px) {{
                    .container {{ width: 100% !important; border-radius: 0 !important; }}
                    .hero-content {{ padding: 40px 20px !important; }}
                    .card-wrapper {{ padding: 20px 15px !important; }}
                    .mobile-stack {{ display: block !important; width: 100% !important; }}
                    .mobile-center {{ text-align: center !important; }}
                }}
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Outfit', Arial, sans-serif;">
            <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
                
                <div style="background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%); padding: 60px 40px; text-align: center;">
                    <div style="margin-bottom: 24px;">
                        <span style="background: rgba(255,255,255,0.1); color: #D8F3DC; padding: 8px 16px; border-radius: 30px; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">
                            Order Confirmed
                        </span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; line-height: 1.2;">
                        Your Poultry Victory <br/><span style="color: #95D5B2;">Starts Today.</span>
                    </h1>
                </div>

                <div class="card-wrapper" style="padding: 40px;">
                    <table style="width: 100%; margin-bottom: 32px; background: #F7F9F9; border-radius: 16px; border: 1px solid #EDF2F2; padding: 16px;">
                        <tr>
                            <td>
                                <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Order ID</div>
                                <div style="font-size: 16px; color: #1B4332; font-weight: 800;">{order.get("order_id", "Unknown")}</div>
                            </td>
                            <td style="text-align: right;">
                                <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Status</div>
                                <div style="font-size: 14px; color: #059669; font-weight: 700;">PROCESSED</div>
                            </td>
                        </tr>
                    </table>

                    <div style="margin-bottom: 32px;">
                        <h3 style="font-size: 14px; color: #1E293B; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; border-left: 4px solid #1B4332; padding-left: 12px;">Delivery Coordinates</h3>
                        <table style="width: 100%; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 20px; padding: 20px;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748B;">Recipient</td>
                                <td style="padding: 8px 0; color: #0F172A; font-weight: 700; text-align: right;">{order.get("customer_name")}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748B;">Contact</td>
                                <td style="padding: 8px 0; color: #0F172A; font-weight: 700; text-align: right;">{order.get("phone")}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="text-align: center; margin-top: 40px;">
                        <a href="https://nutimetry.vercel.app/tracker" style="display: block; background: #1B4332; color: #ffffff; padding: 20px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 16px;">
                            Track Your Order
                        </a>
                    </div>
                </div>

                <div style="background-color: #F8FAFC; padding: 40px; text-align: center; border-top: 1px solid #F1F5F9;">
                    <div style="font-size: 20px; font-weight: 800; color: #1B4332;">NutimetryOrganics</div>
                    <div style="color: #94A3B8; font-size: 11px; margin-top: 20px;">© 2026 NUTIMETRY ORGANICS PRIVATE LIMITED</div>
                </div>
            </div>
        </body>
        </html>
        """

        # Dev-Stage Email Redirection
        # Route to configured notification recipient
        target_email = settings.NOTIFICATION_EMAIL
        
        if settings.ENVIRONMENT == "development":
            logger.info(f"Dev mode active: Sending notification to {target_email}")

            
        idemp_key = order.get('idempotency_key', 'NONE')

        message = MessageSchema(
            subject=f"🚀 ORDER CONFIRMED: {order.get('order_id')} | NutimetryOrganics",
            recipients=[target_email],
            body=html,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        try:
            await fm.send_message(message)
            logger.info(f"Order notification sent for {order.get('order_id')} on attempt {attempt + 1}")
            await db["orders"].update_one(
                {"_id": ObjectId(order_id_str)},
                {"$set": {"email_status": "sent"}}
            )
            return # Success, exit retry loop
        except Exception as e:
            logger.error(f"Email attempt {attempt + 1} failed for {order.get('order_id')}: {e}")

    # If loop completes without returning, all retries failed
    await db["orders"].update_one(
        {"_id": ObjectId(order_id_str)},
        {"$set": {"email_status": "failed"}}
    )
    logger.error(f"All {max_retries} email attempts failed for order {order_id_str}. Marked as failed in DB.")

async def send_enquiry_notification_with_retry(enquiry_id_str: str):
    """
    Sends an email notification for a new farmer enquiry with retry logic.
    """
    db = get_database()
    max_retries = 3
    retry_delays = [0, 5, 15]
    
    for attempt in range(max_retries):
        await asyncio.sleep(retry_delays[attempt])
        
        enquiry = await db["enquiries"].find_one({"_id": ObjectId(enquiry_id_str)})
        if not enquiry:
            logger.error(f"Cannot send email, enquiry {enquiry_id_str} not found in DB.")
            return

        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning("SMTP credentials not configured. Mocking enquiry email failure.")
            break

        # Prepare email body
        created_at_fmt = enquiry.get("created_at").strftime("%Y-%m-%d %H:%M:%S UTC") if isinstance(enquiry.get("created_at"), datetime) else str(enquiry.get("created_at"))
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap');
                @media only screen and (max-width: 600px) {{
                    .container {{ width: 100% !important; border-radius: 0 !important; }}
                    .card-wrapper {{ padding: 20px 15px !important; }}
                }}
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Outfit', Arial, sans-serif;">
            <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
                
                <div style="background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%); padding: 60px 40px; text-align: center;">
                    <div style="margin-bottom: 24px;">
                        <span style="background: rgba(255,255,255,0.1); color: #D8F3DC; padding: 8px 16px; border-radius: 30px; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">
                            Inbound Intelligence
                        </span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; line-height: 1.2;">
                        A New Farmer <br/><span style="color: #95D5B2;">Wants to Connect.</span>
                    </h1>
                </div>

                <div class="card-wrapper" style="padding: 40px;">
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 20px; padding: 24px; margin-bottom: 32px;">
                        <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 700; margin-bottom: 16px;">Lead Metadata</div>
                        <table style="width: 100%;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748B;">Name</td>
                                <td style="padding: 8px 0; color: #0F172A; font-weight: 700; text-align: right;">{enquiry.get("name")}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748B;">Phone</td>
                                <td style="padding: 8px 0; color: #1B4332; font-weight: 700; text-align: right;">{enquiry.get("phone")}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin-bottom: 32px;">
                        <h3 style="font-size: 14px; color: #1E293B; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; border-left: 4px solid #1B4332; padding-left: 12px;">Query Details</h3>
                        <div style="background: #ffffff; border: 1px solid #E2E8F0; padding: 25px; border-radius: 20px; color: #334155; font-size: 16px; line-height: 1.6;">
                            {enquiry.get("message")}
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 40px;">
                        <a href="tel:{enquiry.get('phone')}" style="display: block; background: #1B4332; color: #ffffff; padding: 20px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 16px;">
                            Call Farmer Now
                        </a>
                    </div>
                </div>

                <div style="background-color: #F8FAFC; padding: 40px; text-align: center; border-top: 1px solid #F1F5F9;">
                    <div style="font-size: 20px; font-weight: 800; color: #1B4332;">NutimetryOrganics</div>
                    <div style="color: #94A3B8; font-size: 11px; margin-top: 20px;">© 2026 NUTIMETRY ORGANICS PRIVATE LIMITED</div>
                </div>
            </div>
        </body>
        </html>
        """

        target_email = settings.NOTIFICATION_EMAIL
        
        message = MessageSchema(
            subject=f"📩 New Farmer Enquiry - {enquiry.get('name')} | NutimetryOrganic",
            recipients=[target_email],
            body=html,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        try:
            await fm.send_message(message)
            logger.info(f"Enquiry notification sent for {enquiry.get('name')} on attempt {attempt + 1}")
            await db["enquiries"].update_one(
                {"_id": ObjectId(enquiry_id_str)},
                {"$set": {"email_status": "sent"}}
            )
            return 
        except Exception as e:
            logger.error(f"Enquiry email attempt {attempt + 1} failed: {e}")

    await db["enquiries"].update_one(
        {"_id": ObjectId(enquiry_id_str)},
        {"$set": {"email_status": "failed"}}
    )
