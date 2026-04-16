import re

def detect_language(text: str):
    text = text.strip().lower()

    # 🔹 Short text → default English
    if len(text) <= 3:
        return "en"

    # 🔹 Telugu Unicode
    for ch in text:
        if '\u0C00' <= ch <= '\u0C7F':
            return "te"

    # 🔹 Hindi Unicode
    for ch in text:
        if '\u0900' <= ch <= '\u097F':
            return "hi"

    # 🔹 Roman Telugu keywords
    telugu_keywords = [
        "cheyy", "chey", "andi", "amma", "anna",
        "emi", "enti", "ela", "enduku", "unna",
        "kadha", "avunu", "ledu", "meeru", "nenu", "ni"
    ]

    # 🔹 Hindi keywords
    hindi_keywords = [
        "kya", "kaise", "kyu", "hai", "karna", "kaun", "kab"
    ]

    words = set(re.findall(r'\w+', text))
    telugu_score = sum(word in words for word in telugu_keywords)
    hindi_score = sum(word in words for word in hindi_keywords)

    # 🔥 Decision logic
    if telugu_score > hindi_score:
        return "te"
    elif hindi_score > telugu_score:
        return "hi"

    # 🔹 Default fallback
    return "en"