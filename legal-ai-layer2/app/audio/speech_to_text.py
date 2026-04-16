import whisper
from deep_translator import GoogleTranslator

# 🔥 Load model
model = whisper.load_model("small")

ALLOWED_LANGS = ["en", "hi", "te"]


# 🔹 Detect Telugu from transliteration
def detect_telugu(text):
    words = [
        "chattam", "noota", "vivarinchandi",
        "nenu", "meeru", "emi", "cheppandi"
    ]
    return any(word in text.lower() for word in words)


# 🔹 Detect Hindi
def detect_hindi(text):
    words = ["kya", "hai", "dhara", "mera", "mujhe"]
    return any(word in text.lower() for word in words)


# 🔹 Normalize language
def normalize_lang(lang, text):

    # 🔥 Fix South language confusion → Telugu
    if lang in ["ta", "ml", "kn"]:
        return "te"

    # 🔥 Detect Telugu from English text
    if lang == "en" and detect_telugu(text):
        return "te"

    # 🔥 Detect Hindi
    if lang == "en" and detect_hindi(text):
        return "hi"

    # 🔥 Default
    if lang not in ALLOWED_LANGS:
        return "en"

    return lang


# 🔹 Translate text
def translate_text(text, target_lang):
    try:
        return GoogleTranslator(source='auto', target=target_lang).translate(text)
    except:
        return text


# 🔹 MAIN FUNCTION
def transcribe_audio(file_path):
    try:
        result = model.transcribe(
            file_path,
            task="transcribe",
            temperature=0,
            fp16=False
        )

        text = result["text"].strip()
        raw_lang = result["language"]

        print("🧠 Whisper:", text)
        print("🌍 Raw Detected:", raw_lang)

        # 🔥 Handle empty audio
        if not text:
            return "Please speak clearly", "en"

        # 🔥 Normalize language
        lang = normalize_lang(raw_lang, text)

        # 🔥 Convert to proper script
        if lang in ["te", "hi"]:
            text = translate_text(text, lang)

        print("✅ Final Text:", text)
        print("🌍 Final Lang:", lang)

        return text, lang

    except Exception as e:
        print("❌ Whisper Error:", e)
        return "Speech processing failed", "en"