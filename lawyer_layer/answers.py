# answers.py
import requests
import logging
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=2, min=4, max=10))
def execute_gemini_rest_call(api_key, context, question):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = f"""You are an elite corporate attorney and legal advisor.
The user is providing you with a legal document and a specific question.
Your objective is to provide a comprehensive, robust, and highly accurate legal explanation.
- You absolutely MUST preserve all legal meaning, doctrines, and nuances.
- Break down complex legal jargon into understandable but legally precise terms.
- Use structured formatting and bullet points if you need to summarize clauses.
- MUST INCLUDE: At the very end of your response, explicitly list 3 Real-World Related Case Laws (preferably Indian jurisdiction) corresponding to the core legal principles in this document. Provide a generated directory URL or IndianKanoon URL for each case law.

Document Context:
{context}

User's Question:
{question}

Provide your detailed legal analysis below:
"""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 3000},
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
        ]
    }
    
    response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
    
    # If the response isn't a strict 200 OK, raise exception so tenacity catches and retries it smoothly
    response.raise_for_status()
    
    data = response.json()
    return data['candidates'][0]['content']['parts'][0]['text']

def generate_legal_answer(api_key, context, question):
    try:
        if not api_key:
            return "Server configuration error: Gemini API Key is missing."
            
        return execute_gemini_rest_call(api_key, context, question)
    except Exception as e:
        logging.error(f"Failed to generate legal answer via REST API: {e}")
        return "Our AI servers are currently experiencing high demand. Please wait a minute and try again."
