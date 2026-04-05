from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import shutil
import os

from extractor import extract_text
from answers import generate_legal_answer
from google_cases import search_google_cases
from questions import format_qa
from fastapi import APIRouter

router = APIRouter()

# =========================
# JWT SETTINGS
# =========================
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

fake_users_db = {}

# app = FastAPI(title="LegitMind API with JWT")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "http://127.0.0.1:5173",
#     ],
#     allow_methods=["*"],
#     allow_headers=["*"],
#     allow_credentials=True,
# )

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# =========================
# HOME
# =========================
@router.get("/")
def home():
    return {"message": "LegitMind Backend Running 🚀"}


# =========================
# REGISTER
# =========================
@router.post("/register")
def register(username: str = Form(...), password: str = Form(...)):
    if username in fake_users_db:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = pwd_context.hash(password)

    fake_users_db[username] = {
        "username": username,
        "hashed_password": hashed_password
    }

    return {"message": "User registered successfully"}


# =========================
# LOGIN
# =========================
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = fake_users_db.get(form_data.username)

    if not user or not pwd_context.verify(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    token = jwt.encode(
        {"sub": user["username"], "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {"access_token": token, "token_type": "bearer"}


# =========================
# PROTECTED UPLOAD
# =========================
@router.post("/upload/")
async def upload_document(
    file: UploadFile = File(...),
    token: str = Depends(lambda: None)
):
    # Save file (optional)
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 🔥 IMPORTANT: reset pointer after saving
    file.file.seek(0)

    # ✅ Correct call
    text = extract_text(file)

    return {
        "filename": file.filename,
        "extracted_text": text
    }


# =========================
# PROTECTED ANALYZE
# =========================
@router.post("/analyze/")
async def analyze_document(
    api_key: str = Form(...),
    context: str = Form(...),
    question: str = Form(...)
):
    answer = generate_legal_answer(api_key, context, question)
    cases = search_google_cases(question)
    formatted = format_qa(question, answer, cases)

    return {
        "analysis": formatted
    }

from fastapi import APIRouter
from fastapi.responses import FileResponse
from gtts import gTTS
from pydantic import BaseModel
import uuid

# router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    lang: str
import re

@router.post("/tts/")
async def generate_audio(req: TTSRequest):
    try:
        filename = f"audio_{uuid.uuid4().hex}.mp3"

        # 🔥 CLEAN + LIMIT TEXT
        clean_text = re.sub(r'[\*\#]', '', req.text)
        text = clean_text[:1500]   # 👈 REDUCE MORE (VERY IMPORTANT)

        tts = gTTS(text=text, lang=req.lang)
        tts.save(filename)

        return FileResponse(filename, media_type="audio/mpeg")

    except Exception as e:
        print("TTS ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

