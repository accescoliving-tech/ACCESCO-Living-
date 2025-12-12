# app/services/cancel_service.py
from sqlalchemy.orm import Session
from app.models.orders import Orders
from app.models.cancel_feedback import Cancel_Feedback


# -------------------------------------------------------
# STEP 1: Ask user to confirm cancellation
# -------------------------------------------------------
def handle_cancel_order(body: dict, db: Session):
    params = body.get("queryResult", {}).get("parameters", {}) or {}

    # Try reading order_id from parameters
    order_id = params.get("order_id")

    # If not in parameters, try reading from contexts
    if not order_id:
        contexts = body.get("queryResult", {}).get("outputContexts", []) or []
        for ctx in contexts:
            ctx_params = ctx.get("parameters", {}) or {}
            if "order_id" in ctx_params:
                order_id = ctx_params.get("order_id")
                break

    # Still nothing?
    if not order_id:
        return f"Please tell me the Order ID you want to cancel."

    # Check if order exists
    order = db.query(Orders).filter(Orders.order_id == order_id).first()

    if not order:
        return f"I couldn't find any order with ID {order_id}. Please check again."

    # Return confirmation + store order_id in context
    return f"Are you sure you want to cancel order {order_id}?"


# -------------------------------------------------------
# STEP 2: User says "Yes" → Cancel the order
# -------------------------------------------------------
def handle_cancel_confirm(body: dict, db: Session):
    contexts = body.get("queryResult", {}).get("outputContexts", []) or []

    order_id = None
    for ctx in contexts:
        ctx_params = ctx.get("parameters", {}) or {}
        if "order_id" in ctx_params:
            order_id = ctx_params.get("order_id")
            break

    if not order_id:
        return "I couldn't identify which order to cancel. Please say the Order ID again."

    # Fetch DB order
    order = db.query(Orders).filter(Orders.order_id == order_id).first()

    if not order:
        return f"Order {order_id} was not found in our system."

    # Cancel the order
    order.status = "cancelled"
    db.commit()

    # Ask user for feedback → store order_id in context for next step
    return f"Your order {order_id} has been cancelled. Could you tell me why you cancelled it?"


# -------------------------------------------------------
# STEP 3: Save the feedback message
# -------------------------------------------------------
def handle_cancel_feedback(body: dict, db: Session):
    params = body.get("queryResult", {}).get("parameters", {}) or {}
    feedback = params.get("feedback") or "No feedback provided."

    contexts = body.get("queryResult", {}).get("outputContexts", []) or []
    order_id = None

    for ctx in contexts:
        ctx_params = ctx.get("parameters", {}) or {}
        if "order_id" in ctx_params:
            order_id = ctx_params.get("order_id")

    if not order_id:
        return "Thank you for your feedback."

    # Save feedback
    fb = Cancel_Feedback(order_id=order_id, feedback=feedback)
    db.add(fb)
    db.commit()

    return "Thank you for your feedback. We appreciate it!"
