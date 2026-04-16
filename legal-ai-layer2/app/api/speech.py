from fastapi import APIRouter, UploadFile, File
import uuid, os, subprocess

from app.audio.speech_to_text import transcribe_audio

router = APIRouter()

UPLOAD_DIR = "audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 🔥 IMPORTANT: full ffmpeg path (no PATH dependency)
FFMPEG_PATH = r"C:\ffmpeg\ffmpeg-8.1-essentials_build\bin\ffmpeg.exe"


@router.post("/speech-chat")
async def speech_chat(file: UploadFile = File(...)):
    print("🔥 /speech-chat API HIT")

    file_id = uuid.uuid4().hex

    webm_path = f"{UPLOAD_DIR}/{file_id}.webm"
    wav_path = f"{UPLOAD_DIR}/{file_id}.wav"

    # ✅ Save uploaded file
    with open(webm_path, "wb") as f:
        content = await file.read()
        f.write(content)

    print("📁 Saved WEBM:", webm_path)

    # 🔥 Convert webm → wav using ffmpeg
    try:
        result = subprocess.run(
            [
                FFMPEG_PATH,
                "-y",
                "-i", webm_path,
                "-ar", "16000",
                "-ac", "1",
                "-af", "volume=3.0",
                wav_path
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        if result.returncode != 0:
            print("❌ FFMPEG ERROR:", result.stderr.decode())
            return {"text": "Audio conversion failed", "lang": "en"}

        print("🎧 Converted WAV:", wav_path)

    except Exception as e:
        print("❌ Conversion Exception:", e)
        return {"text": "Audio processing error", "lang": "en"}

    # 🔥 Whisper Transcription
    try:
        user_text, detected_lang = transcribe_audio(wav_path)

        print("🎤 FINAL TEXT:", user_text)
        print("🌍 FINAL LANG:", detected_lang)

    except Exception as e:
        print("❌ Whisper Error:", e)
        return {"text": "Transcription failed", "lang": "en"}

    return {
        "text": user_text,
        "lang": detected_lang
    }