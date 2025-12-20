import uuid
def generate_order_id(prefix: str = "EX"):
    # short unique id
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"
