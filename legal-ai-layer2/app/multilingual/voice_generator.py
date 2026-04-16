from gtts import gTTS
import os
import uuid
import time

def cleanup_old_audio(directory, max_age_seconds=3600):
    now = time.time()
    for f in os.listdir(directory):
        path = os.path.join(directory, f)
        # Delete mp3 files older than an hour
        if os.path.isfile(path) and f.endswith(".mp3"):
            if os.stat(path).st_mtime < now - max_age_seconds:
                try:
                    os.remove(path)
                except Exception:
                    pass

def generate_voice(text, target_lang, output_dir):
    try:
        os.makedirs(output_dir, exist_ok=True)
        cleanup_old_audio(output_dir)

        lang_map = {
            "english": "en",
            "hindi": "hi",
            "telugu": "te",
            "en": "en",
            "hi": "hi",
            "te": "te"
        }

        tts_lang = lang_map.get(target_lang, "en")

        print("🔊 Generating voice in:", tts_lang)

        # Clean text for smoother audio (remove emojis, markdown, and hash symbols)
        clean_text = text.replace("*", "").replace("#", "").replace("_", "")

        filename = f"voice_{uuid.uuid4().hex[:8]}.mp3"
        filepath = os.path.join(output_dir, filename)

        tts = gTTS(text=clean_text, lang=tts_lang)
        tts.save(filepath)

        print("✅ Audio saved at:", filepath)

        return f"/audio/{filename}"

    except Exception as e:
        print(f"❌ Voice Generation Error: {e}")
        return ""