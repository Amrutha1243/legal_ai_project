from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, APIRouter
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import shutil
import os
import re
import uuid
from gtts import gTTS
from pydantic import BaseModel
from pymongo import MongoClient
import certifi

from extractor import extract_text
from answers import generate_legal_answer
from google_cases import search_google_cases
from questions import format_qa

router = APIRouter()

# =========================
# MONGODB CONNECTION (SHARED)
# =========================
MONGO_URL = "mongodb+srv://Amrutha_1243:Amrutha%401243@legalai.rvs8uff.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(MONGO_URL, tlsCAFile=certifi.where())
db = client["legal_ai"]
handoff_collection = db["handoff_cases"]

# =========================
# JWT SETTINGS
# =========================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey")
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
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    token: str = Depends(lambda: None)
):
    # Simply extract the text instantly
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
    context: str = Form(...),
    question: str = Form(...),
    api_key: str = Form(None)
):
    # FORCE load from env directly to prevent frontend 'undefined' strings overriding the key.
    secure_api_key = os.getenv("GEMINI_API_KEY")
    if not secure_api_key:
        print("CRITICAL: GEMINI_API_KEY IS NOT SET IN THE ENVIRONMENT!")
        
    print(f"Executing Gemini with key starting with: {str(secure_api_key)[:5]}... and context length: {len(context)}")
    
    # Web Scraper triggers native firewall blocks on 202/403. 
    # Re-enable the case law programmatic search via DDGS
    answer = generate_legal_answer(secure_api_key, context, question)
    cases = search_google_cases(question) 
    formatted = format_qa(question, answer, cases)

    return {
        "analysis": formatted
    }

class TTSRequest(BaseModel):
    text: str
    lang: str

@router.post("/tts/")
async def generate_audio(req: TTSRequest, background_tasks: BackgroundTasks):
    try:
        filename = f"audio_{uuid.uuid4().hex}.mp3"

        # 🔥 CLEAN + LIMIT TEXT
        clean_text = re.sub(r'[\*\#]', '', req.text)
        text = clean_text[:1500]   # 👈 REDUCE MORE (VERY IMPORTANT)

        tts = gTTS(text=text, lang=req.lang)
        tts.save(filename)

        background_tasks.add_task(os.remove, filename)
        return FileResponse(filename, media_type="audio/mpeg", background=background_tasks)

    except Exception as e:
        print("TTS ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# 📥 FETCH CLIENT HANDOFFS 
# =========================
@router.get("/handoffs/")
def get_client_handoffs():
    # Fetch all handoffs from the MongoDB, sorted by newest first
    try:
        cases = list(handoff_collection.find().sort("created_at", -1).limit(50))
        
        # Format the ObjectId so it can be serialized to JSON
        for case in cases:
            case["_id"] = str(case["_id"])
            if "created_at" in case:
                case["created_at"] = str(case["created_at"])
                
        return {"status": "success", "total": len(cases), "handoffs": cases}
    except Exception as e:
        print("Error fetching handoffs:", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve handoffs")
