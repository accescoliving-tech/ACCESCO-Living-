from sqlalchemy.orm import Session
from app.models.orders import Orders

def handle_track_order(body, db: Session):
    params = body.get("queryResult", {}).get("parameters", {}) or {}
    order_id = params.get("order_id")
    # fallback to contexts
    if not order_id:
        contexts = body["queryResult"].get("outputContexts", []) or []
        for c in contexts:
            p = c.get("parameters", {}) or {}
            if "order_id" in p:
                order_id = p.get("order_id")
                break

    if not order_id:
        return "Please provide your Order ID to track."

    order = db.query(Orders).filter(Orders.order_id == order_id).first()
    if not order:
        return "Order not found. Please check your Order ID."

    status_map = {
        "pending": "received and being processed",
        "confirmed": "confirmed",
        "preparing": "being prepared",
        "out_for_delivery": "out for delivery",
        "delivered": "delivered",
        "cancelled": "cancelled"
    }
    msg = status_map.get(order.status, "in an unknown status")
    return f"Order {order_id} is currently {msg}."
