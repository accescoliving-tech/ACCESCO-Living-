from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
import uuid
from typing import Union, List, Dict, Any

from Accesco_chatbot.app.models.orders import Orders
from Accesco_chatbot.app.models.ingredients import Ingredient
from Accesco_chatbot.app.models.products import Products
from Accesco_chatbot.app.models.temp_cart import TempCart


# -------------------------------------------------------------
# Helpers
# -------------------------------------------------------------
def generate_order_id() -> str:
    return str(uuid.uuid4())[:10].upper()


def _find_order_context_name(platform: str) -> str:
    if platform.lower() == "grokly":
        return "grokly-order"
    if platform.lower() == "swadisht":
        return "swadisht-order"
    return "default-order"


DEFAULT_INGREDIENT_IMAGE = "https://accesco.co.in/images/default-ingredient.png"


# -------------------------------------------------------------
# Rich Content Builders (df-messenger compatible)
# -------------------------------------------------------------
def build_product_rich_cards(items: list, db: Session) -> list:
    """
    Builds richContent cards for products
    """
    rich_cards = []

    for item in items:
        product = db.query(Products).filter(Products.name == item["item"]).first()
        if not product or not product.image_url:
            continue

        rich_cards.append([
            {
                "type": "image",
                "rawUrl": product.image_url,
                "accessibilityText": item["item"]
            },
            {
                "type": "info",
                "title": item["item"].title(),
                "subtitle": f"Qty: {item['quantity']} | ₹{item['total_price']}"
            }
        ])

    return rich_cards


def build_ingredient_rich_cards(ingredient_rows: list) -> list:
    cards = []
    for ing in ingredient_rows:
        cards.append([
            {
                "type": "image",
                "rawUrl": ing.image_url or DEFAULT_INGREDIENT_IMAGE,
                "accessibilityText": ing.name
            },
            {
                "type": "info",
                "title": ing.name.title(),
                "subtitle": f"₹{ing.price}"
            }
        ])
    return cards


# -------------------------------------------------------------
# ADD ITEM (TEMP CART + RICH CONTENT)
# -------------------------------------------------------------
def handle_add_item(
    body: dict,
    db: Session,
    platform: str,
    item_param: Union[str, List[str]]
) -> Dict[str, Any]:

    params = body.get("queryResult", {}).get("parameters", {}) or {}

    # 1) Extract items
    items = []
    if isinstance(item_param, list):
        for key in item_param:
            v = params.get(key)
            if v:
                items.extend(v if isinstance(v, list) else [v])
    else:
        v = params.get(item_param)
        items = v if isinstance(v, list) else [v] if v else []

    items = [str(i).lower() for i in items]
    if not items:
        return {"fulfillmentText": "Please tell me what you want to order."}

    # 2) Quantities
    qtys = params.get("number", [])
    qtys = qtys if isinstance(qtys, list) else [qtys]
    while len(qtys) < len(items):
        qtys.append(1)

    # 3) Customizations
    customizations = params.get("food_customization", [])
    customizations = customizations if isinstance(customizations, list) else [customizations]
    while len(customizations) < len(items):
        customizations.append(None)

    # 4) Session & cart
    session_id = body.get("session", "").split("/")[-1]

    cart = (
        db.query(TempCart)
        .filter(
            TempCart.session_id == session_id,
            TempCart.status == "ACTIVE"
        )
        .first()
    )

    cart_items = list(cart.cart_items) if cart else []

    # 5) Merge items
    for item_name, qty, cust in zip(items, qtys, customizations):
        product = (
            db.query(Products)
            .filter(
                Products.name == item_name,
                Products.available == True
            )
            .first()
        )
        if not product:
            continue

        unit_price = Decimal(product.price)
        quantity = int(qty)

        merged = False
        for item in cart_items:
            if item["item"] == item_name and item.get("customization") == cust:
                item["quantity"] = quantity
                item["total_price"] = float(unit_price * quantity)
                merged = True
                break

        if not merged:
            cart_items.append({
                "item": item_name,
                "quantity": quantity,
                "customization": cust,
                "unit_price": float(unit_price),
                "total_price": float(unit_price * quantity)
            })

    # 6) Recalculate total
    total_price = sum(Decimal(str(i["total_price"])) for i in cart_items)

    # 7) Persist cart
    if not cart:
        cart = TempCart(
            session_id=session_id,
            cart_items=cart_items,
            total_price=float(total_price),
            status="ACTIVE",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(cart)
    else:
        cart.cart_items = cart_items
        cart.total_price = float(total_price)
        cart.updated_at = datetime.utcnow()

    db.commit()

    # 8) Build rich content
    rich_cards = build_product_rich_cards(cart_items, db)

    return {
        "fulfillmentText": "Item added to your cart.",
        "fulfillmentMessages": [
            {
                "payload": {
                    "richContent": rich_cards
                }
            },
            {
                "text": {
                    "text": [
                        "✅ Item added to your cart.\nWould you like to add more items?"
                    ]
                }
            }
        ]
    }


# -------------------------------------------------------------
# CONFIRM ORDER
# -------------------------------------------------------------
def handle_confirm_order(body: dict, db: Session, platform: str) -> Dict[str, Any]:

    session_id = body.get("session", "").split("/")[-1]

    cart = (
        db.query(TempCart)
        .filter(
            TempCart.session_id == session_id,
            TempCart.status == "ACTIVE"
        )
        .first()
    )

    if not cart or not cart.cart_items:
        return {"fulfillmentText": "Your cart is empty. Please add items before confirming."}

    order = Orders(
        order_id=generate_order_id(),
        platform=platform,
        session_id=session_id,
        items=cart.cart_items,
        price=cart.total_price,
        status="confirmed",
        created_at=datetime.utcnow(),
    )

    db.add(order)
    db.delete(cart)
    db.commit()

    rich_cards = build_product_rich_cards(order.items, db)

    return {
        "fulfillmentText": (
            f"🎉 Your {platform} order has been confirmed!\n"
            f"💰 Total Amount: ₹{order.price}\n"
            f"📦 Order ID: {order.order_id}"
        ),
        "fulfillmentMessages": [
            {
                "payload": {
                    "richContent": rich_cards
                }
            },
            {
                "text": {
                    "text": [
                        (
                            f"🎉 Your {platform} order has been confirmed!\n"
                            f"💰 Total Amount: ₹{order.price}\n"
                            f"📦 Order ID: {order.order_id}"
                        )
                    ]
                }
            }
        ]
    }


# -------------------------------------------------------------
# CREATE / MERGE CUSTOM FOOD (RICH CONTENT)
# -------------------------------------------------------------
def handle_create_custom_food(body: dict, db: Session, platform: str) -> Dict[str, Any]:

    params = body.get("queryResult", {}).get("parameters", {}) or {}
    ingredients = params.get("ingredients", [])

    if not ingredients:
        return {"fulfillmentText": "Please tell me which ingredients you want."}

    ingredients = ingredients if isinstance(ingredients, list) else [ingredients]
    ingredients = [i.lower() for i in ingredients]

    session_id = body.get("session", "").split("/")[-1]

    cart = (
        db.query(TempCart)
        .filter(
            TempCart.session_id == session_id,
            TempCart.status == "ACTIVE"
        )
        .first()
    )

    if not cart:
        cart = TempCart(
            session_id=session_id,
            cart_items=[],
            total_price=0,
            status="ACTIVE",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(cart)
        db.flush()

    cart_items = list(cart.cart_items)

    ingredient_rows = (
        db.query(Ingredient)
        .filter(Ingredient.name.in_(ingredients))
        .all()
    )

    if not ingredient_rows:
        return {"fulfillmentText": "Sorry, none of those ingredients are available."}

    added_price = sum(Decimal(i.price) for i in ingredient_rows)

    idx = next((i for i, x in enumerate(cart_items) if x.get("item") == "custom dish"), None)

    if idx is not None:
        old = cart_items[idx]
        merged_ingredients = list(set(old.get("ingredients", [])) | set(ingredients))
        new_price = Decimal(str(old["unit_price"])) + added_price

        cart_items[idx] = {
            **old,
            "ingredients": merged_ingredients,
            "unit_price": float(new_price),
            "total_price": float(new_price)
        }
        action = "updated"
    else:
        cart_items.append({
            "item": "custom dish",
            "quantity": 1,
            "ingredients": ingredients,
            "customization": None,
            "unit_price": float(added_price),
            "total_price": float(added_price)
        })
        action = "created"

    cart.cart_items = cart_items
    cart.total_price = sum(Decimal(str(i["total_price"])) for i in cart_items)
    cart.updated_at = datetime.utcnow()
    db.commit()

    ingredient_cards = build_ingredient_rich_cards(ingredient_rows)

    return {
        "fulfillmentText": "Custom dish updated.",
        "fulfillmentMessages": [
            {
                "payload": {
                    "richContent": ingredient_cards
                }
            },
            {
                "text": {
                    "text": [
                        (
                            f"🍽️ Custom dish {action}!\n"
                            f"Ingredients: {', '.join(ingredients)}\n"
                            f"💰 Price: ₹{cart.cart_items[-1]['total_price']}\n\n"
                            "Would you like to add more items?"
                        )
                    ]
                }
            }
        ]
    }


# -------------------------------------------------------------
# TRACK ORDER
# -------------------------------------------------------------
def handle_track_order(body: dict, db: Session) -> str:

    params = body.get("queryResult", {}).get("parameters", {}) or {}
    order_id = params.get("order_id")

    if not order_id:
        return "Please provide a valid order ID."

    order = db.query(Orders).filter(Orders.order_id == order_id).first()
    if not order:
        return f"No order found with ID {order_id}."

    items = ", ".join(f"{i['quantity']} {i['item']}" for i in order.items)
    created = order.created_at.strftime("%Y-%m-%d %H:%M")

    return (
        f"📦 Order {order.order_id}\n"
        f"Status: {order.status}\n"
        f"Items: {items}\n"
        f"Created at: {created}"
    )
