# app/services/order_service.py
from sqlalchemy.orm import Session
from Accesco_chatbot.app.models.orders import Orders
from datetime import datetime
import uuid
from typing import Union, List, Tuple, Dict, Any


# -------------------------------------------------------------
# Helpers
# -------------------------------------------------------------
def generate_order_id() -> str:
    """Short readable order id"""
    return str(uuid.uuid4())[:10].upper()


def _find_order_context_name(platform: str) -> str:
    """
    Map business platform name to Dialogflow order context.
    """
    platform = platform.lower()

    if platform in ["eatfeast", "swadisht"]:
        return "eatfeast-order"

    if platform in ["gromart", "grokart"]:
        return "gromart-order"

    return ""


# -------------------------------------------------------------
# ADD ITEM
# -------------------------------------------------------------
def handle_add_item(
    body: dict,
    db: Session,
    platform: str,
    item_param: Union[str, List[str]]
) -> Tuple[str, Dict[str, Any]]:

    query = body.get("queryResult", {}) or {}
    params = query.get("parameters", {}) or {}
    output_contexts = query.get("outputContexts", []) or []

    # ---------------- 1) Extract NEW items ----------------
    new_items: List[str] = []

    if isinstance(item_param, list):
        for key in item_param:
            v = params.get(key)
            if v:
                if isinstance(v, list):
                    new_items.extend([str(x) for x in v])
                else:
                    new_items.append(str(v))
    else:
        v = params.get(item_param)
        if isinstance(v, list):
            new_items = [str(x) for x in v]
        elif v:
            new_items = [str(v)]

    # ---------------- 1A) Extract NEW customizations ----------------
    new_customizations = params.get("food_customization", [])
    if not isinstance(new_customizations, list):
        new_customizations = [new_customizations]

    # ---------------- 2) Extract NEW quantities ----------------
    new_qtys = params.get("number", [])
    if not isinstance(new_qtys, list):
        new_qtys = [new_qtys]

    while len(new_qtys) < len(new_items):
        new_qtys.append(1)

    while len(new_customizations) < len(new_items):
        new_customizations.append(None)

    # ---------------- 3) Extract OLD context items ----------------
    ctx_items: List[str] = []
    ctx_qtys: List[Any] = []
    ctx_customizations: List[Any] = []

    order_context_name = _find_order_context_name(platform).lower()

    for ctx in output_contexts:
        ctx_name_last = ctx.get("name", "").split("/")[-1].lower()

        if ctx_name_last == order_context_name:
            ctx_params = ctx.get("parameters", {}) or {}

            raw_items = ctx_params.get("items_list") or []
            raw_qtys = ctx_params.get("qty_list") or []
            raw_customizations = ctx_params.get("customization_list") or []

            ctx_items = raw_items if isinstance(raw_items, list) else [raw_items]
            ctx_qtys = raw_qtys if isinstance(raw_qtys, list) else [raw_qtys]
            ctx_customizations = (
                raw_customizations if isinstance(raw_customizations, list)
                else [raw_customizations]
            )
            break

    while len(ctx_qtys) < len(ctx_items):
        ctx_qtys.append(1)

    while len(ctx_customizations) < len(ctx_items):
        ctx_customizations.append(None)

    # ---------------- 4) Merge OLD + NEW ----------------
    all_items = ctx_items + new_items
    all_qtys = ctx_qtys + new_qtys
    all_customizations = ctx_customizations + new_customizations

    if not all_items:
        return None, {
            "fulfillmentText": "I couldn't understand the items. Please repeat."
        }

    # ---------------- 5) Save to DB ----------------
    session_id = body.get("session", "").split("/")[-1]

    order = (
        db.query(Orders)
        .filter(
            Orders.session_id == session_id,
            Orders.status == "pending"
        )
        .order_by(Orders.id.desc())
        .first()
    )

    if not order:
        order = Orders(
            order_id=generate_order_id(),
            platform=platform,
            session_id=session_id,
            items=[],
            status="pending",
            created_at=datetime.utcnow(),
        )
        db.add(order)

    # Save items with customization
    order.items = [
        {
            "item": it,
            "quantity": qt,
            "customization": cust
        }
        for it, qt, cust in zip(all_items, all_qtys, all_customizations)
    ]

    db.commit()

    # ---------------- 6) Write back Dialogflow context ----------------
    out_ctx = {
        "name": f"{body['session']}/contexts/{order_context_name}",
        "lifespanCount": 10,
        "parameters": {
            "items_list": all_items,
            "qty_list": all_qtys,
            "customization_list": all_customizations
        },
    }

    # ---------------- 7) Response text ----------------
    added_text = ", ".join([
    f"{int(q)} {i}" + (f" ({c})" if c else "")
    for i, q, c in zip(all_items, all_qtys, all_customizations)
])
    print(f"Added text: {added_text}")

    return order.order_id, {
        "fulfillmentText": f"Added {added_text} to your {platform} order. Anything else?",
        "outputContexts": [out_ctx],
    }


# -------------------------------------------------------------
# CONFIRM ORDER
# -------------------------------------------------------------
def handle_confirm_order(body: dict, db: Session, platform: str) -> str:
    session_id = body.get("session", "").split("/")[-1]

    order = (
        db.query(Orders)
        .filter(
            Orders.session_id == session_id,
            Orders.platform == platform,
            Orders.status == "pending"
        )
        .order_by(Orders.id.desc())
        .first()
    )

    if not order:
        return "I couldn't find your order. Please try ordering again."

    order.status = "confirmed"
    db.commit()

    return f"Your {platform} order {order.order_id} has been confirmed! 🎉"

# ------------------------------------------------------
# TRACK ORDER (by order_id OR by user session)
# ------------------------------------------------------
def handle_track_order(body: dict, db: Session) -> str:
    """
    Track order based ONLY on order_id.
    Platform is fetched directly from DB (not contexts).
    """

    params = body.get("queryResult", {}).get("parameters", {}) or {}
    order_id = params.get("order_id")

    if not order_id:
        return "I couldn't find an order ID. Please provide a valid order ID."

    # Fetch the order from DB
    order = db.query(Orders).filter(Orders.order_id == order_id).first()

    if not order:
        return f"No order found with ID {order_id}. Please check the ID and try again."

    # Build readable items list
    items_str = ", ".join(
        [f"{item['quantity']} {item['item']}" for item in order.items]
    )

    # Format timestamp
    created_time = order.created_at.strftime("%Y-%m-%d %H:%M")

    # Response
    return (
        f"Here is the status for your {order.platform} order {order.order_id}:\n"
        f"📌 status: {order.status}\n"
        f"🛒 Items: {items_str}\n"
        f"⏱️ Created at: {created_time}"
    )

