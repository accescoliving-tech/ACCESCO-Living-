from sqlalchemy.orm import Session
from app.models.products import Products

def handle_product_queries(body, db: Session):

    # Extract parameters from Dialogflow ES
    params = body["queryResult"].get("parameters", {})
    product_name = params.get("product")

    if not product_name:
        return "Please tell me which product you're looking for."

    # ES may return list if multiple matches
    if isinstance(product_name, list):
        product_name = product_name[0]

    # Query database for matching product
    product = db.query(Products).filter(
        Products.name.ilike(f"%{product_name}%")
    ).first()

    if not product:
        return f"Sorry, I couldn't find any product matching '{product_name}'."

    availability_text = "available" if product.available else "unavailable"

    return f"{product.name} costs ₹{product.price} and is {availability_text}."
