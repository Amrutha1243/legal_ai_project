from app.multilingual.language_detector import detect_language
from app.multilingual.translator import translate_to_english, translate_to_output_lang
from app.multilingual.voice_generator import generate_voice
import os

AUDIO_FOLDER = "audio"
os.makedirs(AUDIO_FOLDER, exist_ok=True)


def process_multilingual(user_query: str, response: dict):
    """
    Safe multilingual processing
    """

    # ✅ FIX 1: Handle None query (PDF case)
    if not user_query:
        user_query = "hello"

    # ✅ FIX 2: Safe detection
    try:
        detected_lang = detect_language(user_query)
    except:
        detected_lang = "en"

    # 🔹 Optional translation (not used further but safe)
    try:
        english_query = translate_to_english(user_query, detected_lang)
    except:
        english_query = user_query

    # ✅ FIX 3: Safe response extraction
    answer_en = response.get("message")

    if not answer_en:
        answer_en = str(response)

    # 🔹 Clean unwanted Gemini formatting
    if "```" in answer_en:
        answer_en = answer_en.replace("```json", "").replace("```", "").strip()

    # 🔹 Translate safely
    try:
        answer_hi = translate_to_output_lang(answer_en, "hi")
    except:
        answer_hi = answer_en

    try:
        answer_te = translate_to_output_lang(answer_en, "te")
    except:
        answer_te = answer_en

    # 🔹 Generate voice safely
    try:
        voice_en = generate_voice(answer_en, "en", AUDIO_FOLDER)
    except:
        voice_en = None

    try:
        voice_hi = generate_voice(answer_hi, "hi", AUDIO_FOLDER)
    except:
        voice_hi = None

    try:
        voice_te = generate_voice(answer_te, "te", AUDIO_FOLDER)
    except:
        voice_te = None

    return {
        "english": answer_en,
        "hindi": answer_hi,
        "telugu": answer_te,
        "voice_en": voice_en,
        "voice_hi": voice_hi,
        "voice_te": voice_te
    }