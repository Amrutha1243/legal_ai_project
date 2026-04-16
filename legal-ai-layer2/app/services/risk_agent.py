def assess_risk(text: str, summary):

    # 🔥 FIX: ensure string
    if isinstance(summary, dict):
        summary = " ".join(summary.values())

    text = (text or "").lower()
    summary = (summary or "").lower()

    # ---------------- HIGH RISK ----------------
    high_risk_keywords = [
        "legal notice",
        "court",
        "summons",
        "penalty",
        "fine",
        "deadline",
        "immediate payment",
        "lawsuit",
        "case filed"
    ]

    if any(word in text for word in high_risk_keywords):
        return {
            "risk_level": "HIGH",
            "self_solvable": False,
            "reason": (
                "This situation involves an active legal issue or an immediate "
                "deadline. Incorrect action or delay may result in serious legal consequences."
            )
        }

    # ---------------- MEDIUM RISK ----------------
    medium_risk_keywords = [
        "agreement",
        "contract",
        "notice period",
        "termination",
        "resignation",
        "obligations",
        "conditions"
    ]

    if any(word in text for word in medium_risk_keywords):
        return {
            "risk_level": "MEDIUM",
            "self_solvable": True,
            "reason": (
                "This document contains contractual obligations. There is no immediate "
                "legal action, but misunderstanding or violating these terms could "
                "cause problems later."
            )
        }

    # ---------------- LOW RISK ----------------
    return {
        "risk_level": "LOW",
        "self_solvable": True,
        "reason": (
            "This appears to be an informational legal matter with no immediate "
            "legal consequences."
        )
    }