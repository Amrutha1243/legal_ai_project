from app.services.conversation_agent import handle_conversation
from app.services.guidance_agent import generate_guidance
from app.services.llm_provider import gemini_chat
from app.services.query_agent import handle_query_only
from app.services.recommendation.lawyer_recommender import recommend_lawyers
from app.multilingual.translator import translate_to_english, translate_to_output_lang
from app.multilingual.language_detector import detect_language
from app.services.document_agent import (
    classify_document,
    summarize_document,
    extract_actions
)
from app.services.risk_agent import assess_risk
from app.multilingual.voice_generator import generate_voice

import random
import re

AUDIO_DIR = "audio"

# ============================
# HELPERS
# ============================

def translate_response(text, target_lang):
    if target_lang == "en":
        return text
    return translate_to_output_lang(text, target_lang)


def handle_greeting(user_input: str):
    responses = [
        "Hi! How can I assist you with your legal issue today?",
        "Hello! Tell me your legal concern, I’ll guide you.",
        "Hey! I'm here to help with any legal questions.",
        "Hi there! What legal issue are you facing?"
    ]
    return random.choice(responses)


def is_greeting(text: str) -> bool:
    if not text:
        return False

    text = re.sub(r"[^\w\s]", "", text)
    text = text.lower().strip()

    greetings = ["hi", "hello", "hey", "hii", "morning", "afternoon", "evening"]
    if text in ["good morning", "good afternoon", "good evening", "good night"]:
        return True

    return len(text.split()) <= 2 and any(word in greetings for word in text.split())


def extract_legal_reference(text: str):
    text = text.lower()

    # Capture act name and section accurately (e.g. "section 302 of ipc" or "crpc 125")
    match = re.search(r"(section\s*\d+(?:\s*of\s*(?:the\s*)?[a-z\s]+)?|\bipc\s*\d+|\bcrpc\s*\d+)", text)
    if match:
        return match.group(1).strip()

    return None


def format_document_message(doc: dict) -> str:
    message = str(doc.get("what_it_means_for_you", "")).strip()

    points = doc.get("important_points", [])
    if points:
        message += "\n\nKey points:\n"
        for p in points:
            message += f"- {p}\n"

    return message.strip()


def infer_domain_from_query(text: str):
    text = text.lower()

    if any(k in text for k in ["divorce", "family"]):
        return "Family Law"
    if any(k in text for k in ["job", "employment"]):
        return "Employment Law"
    if any(k in text for k in ["rent", "tenant"]):
        return "Rental Law"

    return None


# ============================
# MAIN ORCHESTRATOR
# ============================

def orchestrate(request):

    # 🔥 LANGUAGE HANDLING
    selected_language = getattr(request, "selected_language", None)

    lang_map = {
        "english": "en",
        "hindi": "hi",
        "telugu": "te"
    }

    original_query = request.user_query or ""

    # Detect language from document if user provides no text
    text_for_detection = original_query if original_query.strip() else (request.document_text or "")
    detected_lang = detect_language(text_for_detection)

    if selected_language:
        target_lang = lang_map.get(selected_language, "en")
    else:
        target_lang = detected_lang if detected_lang in ["en", "hi", "te"] else "en"

    print("Detected:", detected_lang)
    print("Target:", target_lang)

    # 🔥 TRANSLATE INPUT → ENGLISH
    if detected_lang != "en":
        user_query = translate_to_english(original_query, detected_lang)
    else:
        user_query = original_query
    print("Translated Query:", user_query)

    conversation_context = request.conversation_context or []
    context_dict = [msg.model_dump() for msg in conversation_context]

    user_location = request.user_location

    # ============================
    # GREETING
    # ============================
    if is_greeting(original_query):
        msg = handle_greeting(original_query)

        final_text = translate_response(msg, target_lang)
        audio_path = generate_voice(final_text, target_lang, AUDIO_DIR)

        return {
            "mode": "chat",
            "message": final_text,
            "audio_url": audio_path
        }

    # ============================
    # LEGAL EXPLANATION
    # ============================
    ref = extract_legal_reference(user_query)
    print("Detected Ref:", ref)
    if ref:
        try:
            from app.services.rag_retriever import get_persistent_rag_chain
            rag_chain = get_persistent_rag_chain()
            
            context_str = str([msg['content'] for msg in context_dict[-4:]]) if context_dict else "None"
            
            if rag_chain:
                query_text = f"Explain {ref} in simple terms. Incorporate this previous chat context if relevant: {context_str}. Include its meaning, when it applies, and punishment if applicable."
                response = rag_chain.invoke(query_text)
                explanation = response.get('result', "No explanation found in documentation.")
            else:
                explanation = gemini_chat(
                    system_prompt=f"""
You are a legal assistant.
Recent conversation history: {context_str}

Explain clearly:
- Meaning
- When it applies
- Punishment
- Example
""",
                    user_message=f"""
                Explain {ref} (Indian law) in simple terms.

                Include:
                - What it means
                - Who can use it
                - When it applies
                - Example
                give a detailed, structured answer. Do not cut off mid-sentence.
"""
                )
            explanation = explanation.replace("\n", "\n• ")

            if not explanation:
                explanation = f"I can help explain {ref}, but unable now."

        except Exception as e:
            print("Explanation Fetch Error:", e)
            explanation = f"Unable to fetch explanation for {ref}"

        final_text = translate_response(explanation, target_lang)
        audio_path = generate_voice(final_text, target_lang, AUDIO_DIR)

        return {
            "mode": "chat",
            "message": final_text,
            "audio_url": audio_path
        }

    # ============================
    # DOCUMENT FLOW
    # ============================
    if request.document_text and request.document_text.strip():

        document_result = classify_document(request.document_text)
        
        if not document_result.get("is_legal", True):
            alert_msg = "🚨 This uploaded document appears to be irrelevant or unrelated to any legal matters. Please provide a valid legal document for analysis."
            final_text = translate_response(alert_msg, target_lang)
            return {
                "mode": "alert",
                "domain": "Irrelevant",
                "message": final_text,
                "audio_url": None,
                "actions": [],
                "is_legal": False
            }

        legal_domain = document_result.get("document_type", "Unknown")

        summary = summarize_document(request.document_text, legal_domain)
        actions = extract_actions(request.document_text, legal_domain)

        message = format_document_message(summary)

        final_text = translate_response(message, target_lang)
        audio_path = generate_voice(final_text, target_lang, AUDIO_DIR)

        return {
            "mode": "document_based",
            "domain": legal_domain,
            "message": final_text,
            "audio_url": audio_path,
            "actions": actions,
            "is_legal": True
        }

    # ============================
    # QUERY FLOW
    # ============================
    query_result = handle_query_only(user_query)
    legal_domain = query_result.get("legal_domain", infer_domain_from_query(user_query) or "General Law")
    issue_summary = str(query_result.get("issue_summary", ""))

    risk_result = assess_risk(user_query, issue_summary)

    guidance = generate_guidance(legal_domain, risk_result, context_dict)
    message_text = "\n".join(guidance.get("content", []))

    # 🔥 ADD THIS PART
    case_type = legal_domain
    location = user_location or "India"

    print("🧠 CASE TYPE:", case_type)
    print("📍 LOCATION:", location)

    lawyers = recommend_lawyers(case_type, location)

    print("👨‍⚖️ LAWYERS:", lawyers)

    # 🔥 FORMAT LAWYERS INTO TEXT
    lawyer_text = ""
    if lawyers:
        lawyer_text = "\n\nRecommended Lawyers:\n"
        for l in lawyers:
            lawyer_text += f"- {l['title']}\n  {l['url']}\n"

    full_message = message_text + lawyer_text

    final_text = translate_response(full_message, target_lang)
    audio_path = generate_voice(final_text, target_lang, AUDIO_DIR)

    return {
        "mode": "guided_chat",
        "domain": legal_domain,
        "message": final_text,
        "audio_url": audio_path,
        "risk": risk_result,
        "lawyers": lawyers   # 🔥 IMPORTANT for frontend
    }
    # ============================
    # FALLBACK
    # ============================
    fallback_msg = "Please explain your legal issue in more detail."

    final_text = translate_response(fallback_msg, target_lang)
    audio_path = generate_voice(final_text, target_lang, AUDIO_DIR)

    return {
        "mode": "guided_chat",
        "message": final_text,
        "audio_url": audio_path
    }
