from sqlalchemy.orm import Session
from app.models.cancel_feedback import CancelFeedback

def handle_cancel_feedback(body, db: Session):
    params = body.get("queryResult", {}).get("parameters", {}) or {}
    order_id = params.get("order_id")
    reason = params.get("cancel_reason") or params.get("reason")

    if not order_id or not reason:
        return "Thanks. If you want to provide more feedback later, you can do so."

    feedback = CancelFeedback(order_id=order_id, reason=reason)
    db.add(feedback)
    db.commit()
    return "Thanks for the feedback. We've recorded your reason for cancelling."
