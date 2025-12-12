# app/routers/webhook.py
from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.order_service import (
    handle_add_item,
    handle_confirm_order,
    handle_track_order
)
from app.services.cancel_service import (
    handle_cancel_order,    
    handle_cancel_confirm,
    handle_cancel_feedback
)

router = APIRouter()

print(">>> WEBHOOK LOADED <<<")


# -------------------------------------------------------
# MAIN WEBHOOK ENDPOINT
# -------------------------------------------------------
@router.post("/webhook")
async def webhook(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return {"fulfillmentText": "Invalid JSON received."}

    query = body.get("queryResult", {}) or {}
    intent = query.get("intent", {}).get("displayName", "") or ""
    params = query.get("parameters", {}) or {}

    intent_lower = intent.lower()

    print("\n---------------------------")
    print("Intent Triggered:", intent)
    print("Parameters:", params)
    print("---------------------------\n")

    # -------------------------------------------------------
    # 💥 ADD ITEM — EATFEAST
    # -------------------------------------------------------
    if intent_lower.startswith("order eatfeast - custom") and "- no" not in intent_lower:
        order_id, response = handle_add_item(
            body=body,
            db=db,
            platform="EatFeast",
            item_param="eatfeast-food-items"
        )
        return response

    # CONFIRM ORDER — EatFeast
    if intent_lower.startswith("order eatfeast - custom - no"):
        reply = handle_confirm_order(body=body, db=db, platform="EatFeast")
        return {"fulfillmentText": reply}

    # -------------------------------------------------------
    # 🛒 ADD ITEM — GROMART
    # -------------------------------------------------------
    if intent_lower.startswith("order gromart - custom") and "- no" not in intent_lower:
        order_id, response = handle_add_item(
            body=body,
            db=db,
            platform="GroMart",
            item_param=[
                "gromart-grocery",
                "GroMart-grocery",
                "GroMArt-grocery",
                "grocery"
            ]
        )
        return response

    # CONFIRM ORDER — GroMart
    if intent_lower.startswith("order gromart - custom - no"):
        reply = handle_confirm_order(body=body, db=db, platform="GroMart")
        return {"fulfillmentText": reply}

    # -------------------------------------------------------
    # ❌ CANCEL ORDER (Ask)
    # -------------------------------------------------------
    if intent_lower == "cancel order":
        reply = handle_cancel_order(body=body, db=db)
        return {"fulfillmentText": reply}

    # CANCEL ORDER (Confirmed)
    if intent_lower == "cancel order - yes":
        reply = handle_cancel_confirm(body=body, db=db)
        return reply
    
    # -------------------------------------------------------
    # 📝 CANCEL FEEDBACK
    #---------------------------------------------------------
    if intent_lower == "cancel order - yes - confirm":
        reply = handle_cancel_feedback(body=body, db=db)
        return {"fulfillmentText": reply}
    
    # ============================================================
    # TRACK ORDER (Works for both EatFeast + GroMart)
    # ============================================================
    # TRACK ORDER
    if "track order" in intent_lower:
        reply = handle_track_order(body=body, db=db)
        return reply


    # -------------------------------------------------------
    # FALLBACK
    # -------------------------------------------------------
    return {"fulfillmentText": "Sorry, I didn't understand that."}

