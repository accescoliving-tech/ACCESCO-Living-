# app/services/order_service.py
from Accesco_chatbot.app.models import ingredients
from sqlalchemy.orm import Session
from Accesco_chatbot.app.models.orders import Orders
from Accesco_chatbot.app.models.ingredients import Ingredient
from Accesco_chatbot.app.models.products import Products
from datetime import datetime
from decimal import Decimal
import uuid
from typing import Union, List, Tuple, Dict, Any

# -------------------------------------------------------------
# Helpers
# -------------------------------------------------------------
def generate_order_id() -> str:
    """Short readable order id"""
    return str(uuid.uuid4())[:10].upper()


def _find_order_context_name(platform: str) -> str:
    if platform.lower() == "grokly":
        return "grokly-order"
    if platform.lower() == "swadisht":
        return "swadisht-order"
    return "default-order"



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

    print(f"handle_add_item called with platform={platform}, item_param={item_param}")
    print(f"Parameters: {params}")
    # ---------------------------------------------------
    # 1) Extract NEW items
    # ---------------------------------------------------
    new_items: List[str] = []

    if isinstance(item_param, list):
        for key in item_param:
            v = params.get(key)
            if v:
                if isinstance(v, list):
                    new_items.extend([str(x).lower() for x in v])
                else:
                    new_items.append(str(v).lower())
    else:
        v = params.get(item_param)
        if isinstance(v, list):
            new_items = [str(x).lower() for x in v]
        elif v:
            new_items = [str(v).lower()]
    print(f"Extracted new_items: {new_items}")
    
    # ---------------------------------------------------
    # 2) Extract NEW quantities
    # ---------------------------------------------------
    new_qtys = params.get("number", [])
    if not isinstance(new_qtys, list):
        new_qtys = [new_qtys]

    while len(new_qtys) < len(new_items):
        new_qtys.append(1)

    print(f"Extracted new_qtys: {new_qtys}")
    
    # ---------------------------------------------------
    # 3) Extract NEW customizations
    # ---------------------------------------------------
    new_customizations = params.get("food_customization", [])
    if not isinstance(new_customizations, list):
        new_customizations = [new_customizations]

    while len(new_customizations) < len(new_items):
        new_customizations.append(None)

    print(f"Extracted new_customizations: {new_customizations}")
    
    # ---------------------------------------------------
    # 4) Extract OLD context data
    # ---------------------------------------------------
    ctx_items, ctx_qtys, ctx_customizations = [], [], []

    order_context_name = _find_order_context_name(platform).lower()

    for ctx in output_contexts:
        if ctx.get("name", "").split("/")[-1].lower() == order_context_name:
            ctx_params = ctx.get("parameters", {}) or {}
            ctx_items = ctx_params.get("items_list", [])
            ctx_qtys = ctx_params.get("qty_list", [])
            ctx_customizations = ctx_params.get("customization_list", [])
            break

    ctx_items = ctx_items if isinstance(ctx_items, list) else [ctx_items]
    ctx_qtys = ctx_qtys if isinstance(ctx_qtys, list) else [ctx_qtys]
    ctx_customizations = (
        ctx_customizations if isinstance(ctx_customizations, list)
        else [ctx_customizations]
    )

    while len(ctx_qtys) < len(ctx_items):
        ctx_qtys.append(1)

    while len(ctx_customizations) < len(ctx_items):
        ctx_customizations.append(None)

    # ---------------------------------------------------
    # 5) Merge OLD + NEW
    # ---------------------------------------------------
    all_items = ctx_items + new_items
    all_qtys = ctx_qtys + new_qtys
    all_customizations = ctx_customizations + new_customizations

    if not all_items:
        return None, {"fulfillmentText": "I couldn't understand the items."}

    # ---------------------------------------------------
    # 6) Fetch / Create Order
    # ---------------------------------------------------
    session_id = body.get("session", "").split("/")[-1]
    print(f"Session ID: {session_id}")
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
            price=0,
            status="pending",
            created_at=datetime.utcnow(),
        )
        db.add(order)
        db.flush()

    # ---------------------------------------------------
    # 7) Build order items + calculate price
    # ---------------------------------------------------
    order_items = []
    order_total = Decimal("0.00")

    for item, qty, cust in zip(all_items, all_qtys, all_customizations):
        product = (
            db.query(Products)
            .filter(
                Products.name == item,
                Products.available == True
            )
            .first()
        )

        if not product:
            continue

        quantity = int(qty)
        unit_price = Decimal(product.price)
        item_total = unit_price * quantity

        order_items.append({
            "item": item,
            "quantity": quantity,
            "customization": cust,
            "unit_price": float(unit_price),
            "total_price": float(item_total)
        })

        order_total += item_total

    order.items = order_items
    order.price = float(order_total)

    db.commit()

    print("✅ ORDER COMMITTED. ID:", order.id)

    # ---------------------------------------------------
    # 8) Write back Dialogflow context
    # ---------------------------------------------------
    out_ctx = {
        "name": f"{body['session']}/contexts/{order_context_name}",
        "lifespanCount": 10,
        "parameters": {
            "items_list": all_items,
            "qty_list": all_qtys,
            "customization_list": all_customizations
        },
    }

    # ---------------------------------------------------
    # 9) Response text
    # ---------------------------------------------------
    added_text = ", ".join([
        f"{i['quantity']} {i['item']}"
        + (f" ({i['customization']})" if i.get("customization") else "")
        + f" (₹{i['total_price']})"
        for i in order_items
    ])

    return order.order_id, {
        "fulfillmentText": (
            f"Added {added_text} to your {platform} order.\n"
            f"🧾 Current total: ₹{order.price}\n"
            f"Anything else?"
        ),
        "outputContexts": [out_ctx],
    }
    
# -------------------------------------------------------------
# CONFIRM ORDER
# -------------------------------------------------------------
def handle_confirm_order(body: dict, db: Session, platform: str) -> str:
    session_id = body.get("session", "").split("/")[-1]
    print(f"Confirming order for session_id={session_id}, platform={platform}")
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

    print(f"Fetched order: {order}")
    
    if not order:
        return "I couldn't find your order. Please try ordering again."

    order.status = "confirmed"
    db.commit()

    return f"Your {platform} order {order.order_id} has been confirmed! 🎉"


def handle_create_custom_food(
    body: dict,
    db: Session,
    platform: str
):
    query = body.get("queryResult", {}) or {}
    params = query.get("parameters", {}) or {}

    # --------------------------------------------------
    # 1) Extract ingredients
    # --------------------------------------------------
    ingredients = params.get("ingredients", [])
    if not ingredients:
        return {
            "fulfillmentText": "Please tell me which ingredients you want."
        }

    if not isinstance(ingredients, list):
        ingredients = [ingredients]

    ingredients = [i.lower() for i in ingredients]
    print("Extracted ingredients:", ingredients)

    # --------------------------------------------------
    # 2) Fetch / Create Order (DO NOT rely on session_id alone)
    # --------------------------------------------------
    session_id = body.get("session", "").split("/")[-1]

    from sqlalchemy import func

    order = (
        db.query(Orders)
        .filter(
            Orders.status == "pending",
            func.lower(Orders.platform) == platform.lower()
        )
        .order_by(Orders.created_at.desc())
        .first()
    )

    if not order:
        order = Orders(
            order_id=generate_order_id(),
            platform=platform,
            session_id=session_id,
            items=[],
            price=0,
            status="pending",
            created_at=datetime.utcnow(),
        )
        db.add(order)
        db.flush()

    # --------------------------------------------------
    # 3) Fetch ingredient prices
    # --------------------------------------------------
    ingredient_rows = (
        db.query(Ingredient)
        .filter(Ingredient.name.in_(ingredients))
        .all()
    )

    if not ingredient_rows:
        return {
            "fulfillmentText": "Sorry, none of those ingredients are available."
        }

    added_price = Decimal("0.00")
    ingredient_names = []

    for ing in ingredient_rows:
        added_price += Decimal(ing.price)
        ingredient_names.append(ing.name)

    # --------------------------------------------------
# MERGE / CREATE CUSTOM DISH (FINAL VERSION)
# --------------------------------------------------

    existing_items = list(order.items) if order.items else []

    custom_dish_index = None
    for idx, item in enumerate(existing_items):
        if item.get("item") == "custom dish":
            custom_dish_index = idx
            break

    if custom_dish_index is not None:
        old_item = existing_items[custom_dish_index]

        # Merge ingredients (no duplicates)
        existing_ingredients = set(old_item.get("ingredients", []))
        incoming_ingredients = set(ingredient_names)
        merged_ingredients = list(existing_ingredients.union(incoming_ingredients))

        # Recalculate price
        existing_price = Decimal(str(old_item.get("unit_price", 0)))
        updated_price = existing_price + added_price

        updated_item = {
            **old_item,
            "ingredients": merged_ingredients,
            "unit_price": float(updated_price),
            "total_price": float(updated_price),
        }

        existing_items[custom_dish_index] = updated_item
        custom_dish = updated_item
        action_text = "updated"

    else:
        # First custom dish
        updated_item = {
            "item": "custom dish",
            "quantity": 1,
            "ingredients": ingredient_names,
            "customizations": [],
            "unit_price": float(added_price),
            "total_price": float(added_price),
        }

        existing_items.append(updated_item)
        custom_dish = updated_item
        action_text = "created"

    # --------------------------------------------------
    # PERSIST ORDER (JSON reassignment is REQUIRED)
    # --------------------------------------------------

    order.items = existing_items
    order.price = float(order.price or 0) + float(added_price)

    db.commit()

    # --------------------------------------------------
    # DEBUG LOGS (optional but recommended)
    # --------------------------------------------------
    print(
        f"Custom dish {action_text}: "
        f"ingredients={custom_dish['ingredients']}, "
        f"price={custom_dish['total_price']}"
    )

    # --------------------------------------------------
    # 5) Write Dialogflow context
    # --------------------------------------------------
    order_context_name = _find_order_context_name(platform)

    out_ctx = {
        "name": f"{body['session']}/contexts/{order_context_name}",
        "lifespanCount": 10,
        "parameters": {
            "has_custom_dish": True,
            "custom_dish_ingredients": custom_dish["ingredients"],
            "items_list": [i["item"] for i in order.items]
        },
    }

    # --------------------------------------------------
    # 6) Response
    # --------------------------------------------------
    ingredients_text = ", ".join(custom_dish["ingredients"])

    print(
        f"Custom dish {action_text}: ingredients={ingredients_text}, "
        f"price={custom_dish['total_price']}"
    )

    return {
        "fulfillmentText": (
            f"🍽️ Custom dish {action_text}!\n"
            f"Ingredients: {ingredients_text}\n"
            f"💰 Price: ₹{custom_dish['total_price']}\n\n"
            "Would you like to add more items or confirm your order?"
        ),
        "outputContexts": [out_ctx],
    }
    
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

