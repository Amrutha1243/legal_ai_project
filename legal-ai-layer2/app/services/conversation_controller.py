def decide_next_step(conversation_context: list, legal_domain: str = None):
    """
    Decides whether the assistant should ask a follow-up question
    or proceed with guidance, based on missing information.
    """

    if not legal_domain:
        return {"action": "PROVIDE_GUIDANCE"}

    user_text = " ".join(
        msg["content"].lower()
        for msg in conversation_context
        if msg["role"] == "user"
    )

    # ---------------- EMPLOYMENT ----------------
    if legal_domain == "Employment Law":

        if not any(word in user_text for word in ["notice", "notice period", "30 days"]):
            return {
                "action": "ASK_FOLLOW_UP",
                "question": "Does your employment agreement mention a notice period?",
                "options": ["Yes", "No", "Not sure"]
            }

        if "resign" in user_text and not any(word in user_text for word in ["date", "when", "timeline"]):
            return {
                "action": "ASK_FOLLOW_UP",
                "question": "Are you planning to resign soon or just reviewing the agreement?",
                "options": ["Planning to resign", "Just reviewing"]
            }

    # ---------------- LEGAL NOTICE ----------------
    if legal_domain == "Legal Notice":

        if not any(word in user_text for word in ["deadline", "due date", "within"]):
            return {
                "action": "ASK_FOLLOW_UP",
                "question": "Does the notice mention a deadline for response?",
                "options": ["Yes", "No", "Not sure"]
            }

        if "payment" in user_text and not any(word in user_text for word in ["amount", "rs", "₹"]):
            return {
                "action": "ASK_FOLLOW_UP",
                "question": "Is a specific amount mentioned in the notice?",
                "options": ["Yes", "No"]
            }

    # ---------------- RENTAL ----------------
    if legal_domain == "Rental Law":

        if "deposit" not in user_text:
            return {
                "action": "ASK_FOLLOW_UP",
                "question": "Does the rental agreement mention a security deposit?",
                "options": ["Yes", "No"]
            }

        if any(word in user_text for word in ["evict", "eviction"]) and "notice" not in user_text:
            return {
                "action": "ASK_FOLLOW_UP",
                "question": "Have you received any written eviction notice?",
                "options": ["Yes", "No"]
            }

    # ---------------- FAMILY / DIVORCE ----------------
    if legal_domain == "Family Law":

        if not any(word in user_text for word in ["mutual", "contested"]):
            return {
                "action": "ASK_FOLLOW_UP",
                "question": "Is this a mutual divorce or a contested divorce?",
                "options": ["Mutual divorce", "Contested divorce"]
            }

        if "child" not in user_text:
            return {
                "action": "ASK_FOLLOW_UP",
                "question": "Are there any children involved in the marriage?",
                "options": ["Yes", "No"]
            }

    # ---------------- DEFAULT ----------------
    return {
        "action": "PROVIDE_GUIDANCE"
    }
