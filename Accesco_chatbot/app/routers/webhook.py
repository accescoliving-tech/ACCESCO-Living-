# app/routers/webhook.py
from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
import time

from Accesco_chatbot.app.database import get_db
from Accesco_chatbot.app.services.order_service import (
    handle_add_item,
    handle_confirm_order,
    handle_create_custom_food,
    handle_track_order
)
from Accesco_chatbot.app.services.cancel_service import (
    handle_cancel_order,
    handle_cancel_confirm,
    handle_cancel_feedback
)

router = APIRouter()

print(">>> WEBHOOK LOADED <<<")


@router.post("/webhook")
async def webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    start_time = time.time()

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

    # ============================================================
    # 🧺 ADD ITEM — SWADISHT (SYNC, RICH RESPONSE)
    # ============================================================
    if intent_lower.startswith("order swadisht - custom") and "- no" not in intent_lower:
        print("Adding item to Swadisht cart...")

        response = handle_add_item(
            body=body,
            db=db,
            platform="Swadisht",
            item_param="eatfeast-food-items"
        )

        print("⏱️ Webhook time:",
              round((time.time() - start_time) * 1000, 2), "ms")

        return response

    # ============================================================
    # ✅ CONFIRM ORDER — SWADISHT
    # ============================================================
    if intent_lower.startswith("order swadisht - custom - no"):
        response = handle_confirm_order(body=body, db=db, platform="Swadisht")
        return response

    if intent_lower.startswith("create-custom-food - confirm"):
        response = handle_confirm_order(body=body, db=db, platform="Swadisht")
        return response

    # ============================================================
    # 🧺 ADD ITEM — GROKLY (SYNC, RICH RESPONSE)
    # ============================================================
    if intent_lower.startswith("order grokly - custom") and "- no" not in intent_lower:
        print("Adding item to Grokly cart...")

        response = handle_add_item(
            body=body,
            db=db,
            platform="Grokly",
            item_param="GroMArt-grocery"
        )

        print("⏱️ Webhook time:",
              round((time.time() - start_time) * 1000, 2), "ms")

        return response

    # ============================================================
    # ✅ CONFIRM ORDER — GROKLY
    # ============================================================
    if intent_lower.startswith("order grokly - custom - no"):
        response = handle_confirm_order(body=body, db=db, platform="Grokly")
        return response

    # ============================================================
    # 🍳 CREATE CUSTOM FOOD
    # ============================================================
    if intent_lower == "create-custom-food":
        response = handle_create_custom_food(
            body=body,
            db=db,
            platform="Swadisht"
        )
        return response

    # ============================================================
    # ❌ CANCEL ORDER
    # ============================================================
    if intent_lower == "cancel order":
        reply = handle_cancel_order(body=body, db=db)
        return {"fulfillmentText": reply}

    if intent_lower == "cancel order - yes":
        reply = handle_cancel_confirm(body=body, db=db)
        return {"fulfillmentText": reply}

    if intent_lower == "cancel order - yes - confirm":
        reply = handle_cancel_feedback(body=body, db=db)
        return {"fulfillmentText": reply}

    # ============================================================
    # 🚚 TRACK ORDER
    # ============================================================
    if "track order" in intent_lower:
        reply = handle_track_order(body=body, db=db)
        return {"fulfillmentText": reply}

    # ============================================================
    # FALLBACK
    # ============================================================
    return {"fulfillmentText": "Sorry, I didn't understand that."}
