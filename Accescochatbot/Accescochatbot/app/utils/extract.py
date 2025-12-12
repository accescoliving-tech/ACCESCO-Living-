def get_param(body: dict, name: str):
    # Try queryResult.parameters
    query = body.get("queryResult", {})
    params = query.get("parameters", {}) or {}
    if name in params and params[name]:
        return params[name]

    # Try outputContexts (often used to store across follow-ups)
    contexts = query.get("outputContexts", []) or []
    for ctx in contexts:
        ctx_params = ctx.get("parameters", {}) or {}
        if name in ctx_params and ctx_params[name]:
            return ctx_params[name]

    return None
