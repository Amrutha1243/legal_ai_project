import re

CONVERSATION_PATTERNS = [
    r"^(hi|hello|hey|good morning|good evening)",
    r"how are you",
    r"what can you do",
    r"who are you",
    r"thank you",
    r"thanks",
    r"ok",
    r"okay"
]

def is_conversational(text: str) -> bool:
    text = text.lower().strip()
    return any(re.search(pattern, text) for pattern in CONVERSATION_PATTERNS)
