from google import genai
from google.genai.errors import ClientError
import os

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def generate_guidance(legal_domain, risk, conversation_context=None):
    """
    Generates step-by-step, situation-specific legal guidance
    followed by meaningful follow-up questions.
    """

    # -------------------------------
    # CONVERSATION CONTEXT
    # -------------------------------
    context_text = ""
    if conversation_context:
        context_text = "\n".join(
            f"{m['role']}: {m['content']}"
            for m in conversation_context[-6:]
        )

    # -------------------------------
    # PROMPT
    # -------------------------------
    prompt = f"""
You are a Legal AI Assistant helping a real person.

Conversation so far:
{context_text}

Legal domain: {legal_domain}
Risk level: {risk.get("risk_level")}

CRITICAL RULES (MUST FOLLOW):
- Talk ONLY about the user's situation
- DO NOT explain legal theory or definitions
- DO NOT mention sections, acts, or punishments
- DO NOT ask which legal domain this is
- Use simple, calm, human-friendly English
- Do NOT repeat earlier advice
- This is general guidance, not professional legal advice

YOUR TASK:
1. Briefly explain what the situation means for the user.
2. Clearly list the process or next steps in numbered form.
3. Ask EXACTLY 2 meaningful follow-up questions.

OUTPUT STRUCTURE:
- Short explanation paragraph
- Numbered steps
- A section titled: "To help you further:"
- Then 2 follow-up questions
"""

    import time
    max_retries = 3
    text = ""
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="models/gemini-2.5-flash",
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    temperature=0.7
                )
            )
            text = response.text.strip() if response.text else ""
            break # Success, exit loop
            
        except Exception as e:
            error_str = str(e)
            print(f"⚠️ Guidance AI ERROR (Attempt {attempt+1}/{max_retries}):", error_str)
            if "503" in error_str or "quota" in error_str.lower() or "overloaded" in error_str.lower() or "RESOURCE_EXHAUSTED" in error_str:
                time.sleep(2)
                continue
            else:
                break # Hard error

    if not text:
        text = (
            "⚠️ Our Legal AI service is currently experiencing extremely high traffic.\n\n"
            "While we cannot provide personalized guidance at this exact second, we recommend "
            "documenting everything related to your case and safely storing your records. "
            "Please try this query again in a few minutes or consult a legal professional below."
        )

    return {
        "type": "GUIDED_LEGAL_ADVICE",
        "content": [
            line.strip()
            for line in text.split("\n")
            if line.strip()
        ],
        "disclaimer": (
            "This guidance is for general understanding only "
            "and is not a substitute for professional legal advice."
        )
    }
