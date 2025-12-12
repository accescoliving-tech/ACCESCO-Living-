def venture_descriptions(ventures: list):

    details = {
        "GroMart": "GroMart is Exess’s grocery delivery service offering fast and fresh essentials.",
        "EatFeast": "EatFeast is Exess’s premium food delivery service featuring top restaurants and diverse cuisines.",
        "CalcIQ": "CalcIQ is Exess’s AI-powered smart calculator designed for quick and accurate computations.",
        "RewardPlay": "RewardPlay is Exess’s interactive reward platform where users earn points by playing and engaging.",
        "Dineout Cloud": "Dineout Cloud is Exess’s cloud-based restaurant management system for modern dining businesses.",
        "Accesco Vault": "Accesco Vault is Exess’s secure digital vault for storing passwords, documents, and sensitive data."
    }

    reply = []

    for v in ventures:
        # Match case-insensitively (GroMart = gromart = GROMART)
        key = next((k for k in details if k.lower() == v.lower()), None)

        if key:
            reply.append(f"{key}: {details[key]}")
        else:
            reply.append(f"Sorry, I don’t have information about '{v}'. Please try asking about our available ventures.")

    return "\n\n".join(reply)
