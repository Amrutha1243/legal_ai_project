from deep_translator import GoogleTranslator

def safe_translate(source, target, text):
    try:
        return GoogleTranslator(source=source, target=target).translate(text)
    except Exception as e:
        print(f"Translation Error: {e}")
        return text


def translate_to_english(text, source_lang):
    if source_lang in ["en", "auto"]:
        return text
    return safe_translate(source_lang, "en", text)


def translate_to_output_lang(text, target_lang):
    if target_lang == "en":
        return text

    translated = safe_translate("en", target_lang, text)

    # fallback
    if not translated or len(translated) < 5:
        return text

    return translated