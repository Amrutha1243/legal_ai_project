def infer_domain_from_query(text: str):
    if not text:
        return None

    text = text.lower()

    if any(k in text for k in ["divorce", "custody", "alimony", "marriage"]):
        return "Family Law"

    if any(k in text for k in ["job", "salary", "fired", "termination"]):
        return "Employment Law"

    if any(k in text for k in ["rent", "tenant", "landlord", "property"]):
        return "Rental Law"

    if "notice" in text:
        return "Legal Notice"

    return None
