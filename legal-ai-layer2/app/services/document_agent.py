import json
from google import genai
import os

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# -------------------------------
# DOCUMENT CLASSIFICATION
# -------------------------------
def classify_document(document_text: str):
    prompt = f"""
You are a strict legal AI document classifier.
Determine if the provided document is a relevant legal document (e.g., contract, agreement, legal notice, court document, law excerpt).

If it is a legal document, return 'is_legal': true and specify its 'document_type' (e.g., 'Employment Agreement', 'Rental Agreement', 'Legal Notice', 'Contract', etc.).
If it is NOT purely a legal document (e.g., recipe, source code, casual letter, marketing material, irrelevant text), return 'is_legal': false and 'document_type': 'Irrelevant'.

Return JSON STRICTLY in this format:
{{
    "is_legal": true or false,
    "document_type": "...",
    "confidence": 0.95
}}

Document Text:
{document_text}
"""
    import time
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="models/gemini-2.5-flash",
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            return json.loads(response.text)
        except Exception as e:
            error_str = str(e)
            print(f"❌ Classification failed (Attempt {attempt+1}):", error_str)
            if "503" in error_str or "quota" in error_str.lower() or "overloaded" in error_str.lower() or "50" in error_str:
                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s...
                print(f"Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            else:
                break
                
    return {"document_type": "Unknown", "is_legal": True, "confidence": 0.50}


# -------------------------------
# DOCUMENT SUMMARIZATION (GEMINI 2.5)
# -------------------------------
def summarize_document(document_text: str, document_type: str):

    prompt = f"""
You are a legal assistant analyzing a single document.
CONTEXT RESTRICTION: You must analyze ONLY this current document. Do NOT rely on or refer to any previous documents or chat history.

Explain the following legal document in VERY SIMPLE English. Preserve legal meaning.
CRITICAL RULE: You MUST explicitly include and state ALL specific details found in the text, such as exactly what Acts (e.g. IPC, CrPC), sections, salary amounts, numbers, percentages, and dates are mentioned. Do NOT summarize away exact numbers.

Return STRICT JSON with keys:
- what_this_document_is
- who_is_involved
- what_it_means_for_you
- important_points (list)

Document type: {document_type}

Document:
{document_text}
"""

    import time
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="models/gemini-2.5-flash",
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            print("\n===== RAW GEMINI OUTPUT =====\n")
            print(response.text)
            print("\n============================\n")

            return json.loads(response.text)

        except Exception as e:
            error_str = str(e)
            print(f"❌ Gemini summary failed (Attempt {attempt+1}):", error_str)
            if "503" in error_str or "quota" in error_str.lower() or "overloaded" in error_str.lower() or "50" in error_str:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            else:
                break

    # Guaranteed fallback
    return {
        "what_this_document_is": f"This document is a {document_type}.",
        "who_is_involved": "The parties mentioned in the document.",
        "what_it_means_for_you": "This document explains your rights and obligations.",
        "important_points": [
            "Read the document carefully",
            "There may be legal responsibilities",
            "Consult a lawyer for exact details due to high server load"
        ]
    }


# -------------------------------
# ACTION EXTRACTION (RULE-BASED)
# -------------------------------
def extract_actions(document_text: str, document_type: str):
    actions = []
    text = document_text.lower()

    if document_type == "Employment Agreement":
        if any(w in text for w in ["notice", "नोटिस", "నోటీసు"]):
            actions.append("Give notice before resignation")
        if any(w in text for w in ["salary", "pay", "वेतन", "सैलरी", "జీతం"]):
            actions.append("Check salary payment terms")
        actions.append("Follow termination rules")

    elif document_type == "Rental Agreement":
        actions.append("Pay rent on time")
        actions.append("Understand deposit and eviction rules")

    elif document_type == "Legal Notice":
        actions.append("Respond within the specified time limit")
        actions.append("Consult a lawyer if required")

    else:
        actions.append("Review the document carefully")

    return actions
