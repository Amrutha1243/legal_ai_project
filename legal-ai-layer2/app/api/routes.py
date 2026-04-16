from fastapi import APIRouter, UploadFile, File, Form, Depends
from pydantic import BaseModel
from app.core.schemas import AnalyzeRequest, MetricsRequest
from app.services.orchestrator import orchestrate
from app.routers.auth_router import get_current_user
from app.utils.document_utils import extract_text_from_upload
from app.services.multilingual_service import process_multilingual
from app.multilingual.translator import translate_to_output_lang
from app.multilingual.voice_generator import generate_voice
# ✅ IMPORT SPEECH ROUTER
from app.api.speech import router as speech_router
from app.utils.metrics import calculate_metrics
from app.api.database import handoff_collection
from app.services.llm_provider import gemini_chat
import json
import uuid
from datetime import datetime

router = APIRouter()
class TranslateRequest(BaseModel):
    text: str
    target_lang: str

class HandoffRequest(BaseModel):
    chat_context: list
    user_location: str = "Unknown"
    user_id: str = "guest_user"

@router.post("/translate")
def translate_api(req: TranslateRequest):
    from app.multilingual.translator import safe_translate
    
    lang_map = {
        "english": "en",
        "hindi": "hi",
        "telugu": "te"
    }
    target = lang_map.get(req.target_lang.lower(), req.target_lang)

    translated = safe_translate("auto", target, req.text)
    
    # Fallback to original text if translation completely fails
    if not translated:
        translated = req.text
        
    audio_path = generate_voice(translated, target, "audio")
    return {
        "translated_text": translated,
        "audio_url": audio_path
    }

# ✅ INCLUDE SPEECH ROUTES CORRECTLY
router.include_router(speech_router)


# ---------------- TEXT ANALYSIS ----------------
@router.post("/analyze")
def analyze(request: AnalyzeRequest, current_user: dict = Depends(get_current_user)):
    response = orchestrate(request)

    safe_query = request.user_query or "hello"

    response["multilingual"] = process_multilingual(
        safe_query,
        response
    )

    return response


# ---------------- DOCUMENT ANALYSIS ----------------
@router.post("/analyze/document")
def analyze_document(
    user_query: str = Form(None),
    user_location: str = Form(None),
    document_text: str = Form(None),
    document: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    if document:
        extracted_text = extract_text_from_upload(document)
        request = AnalyzeRequest(
            user_query=user_query,
            document_text=extracted_text,
            user_location=user_location
        )
    else:
        request = AnalyzeRequest(
            user_query=user_query,
            document_text=document_text,
            user_location=user_location
        )

    response = orchestrate(request)

    response["multilingual"] = process_multilingual(
        request.user_query,
        response
    )

    if document:
        response["extracted_document_text"] = extracted_text
    elif document_text:
        response["extracted_document_text"] = document_text

    return response

# ---------------- METRICS EVALUATION ----------------
@router.post("/evaluate/metrics")
def evaluate_metrics(request: MetricsRequest):
    """
    Calculate classification metrics such as Accuracy, Precision, Recall, and F1.
    Usage: pass {"y_true": ["category1"], "y_pred": ["category1"]}
    """
    return calculate_metrics(request.y_true, request.y_pred)

# ---------------- LAWYER HANDOFF ----------------
@router.post("/handoff")
def create_lawyer_handoff(request: HandoffRequest):
    context_str = json.dumps(request.chat_context)
    
    prompt = f"""
    You are an expert Legal Intake Paralegal. Analyze this chat history between a user and our Legal AI.
    Create a highly professional, condensed "Client Intake Brief" meant for a human Lawyer to read.
    Return ONLY a JSON object with these keys:
    1. "legal_domain": String (The area of law)
    2. "client_timeline": String (A bulleted list of the events/facts mentioned)
    3. "risk_assessment": String (High/Medium/Low and one sentence why)
    4. "lawyer_instructions": String (What the lawyer needs to do next)

    Chat History: {context_str}
    """
    
    try:
        response_text = gemini_chat(prompt, "Generate Intake Brief JSON")
        clean_json = response_text.replace("```json", "").replace("```", "").strip()
        brief_data = json.loads(clean_json)
    except Exception as e:
        print("Handoff generation error:", e)
        brief_data = {"error": "Failed to structure LLM data", "raw_history": context_str}

    # Save to MongoDB for the Lawyer Layer to pick up
    handoff_doc = {
        "handoff_id": str(uuid.uuid4())[:8],
        "user_id": request.user_id,
        "location": request.user_location,
        "status": "pending_review",
        "created_at": datetime.now(),
        "parsed_brief": brief_data,
        "raw_history": request.chat_context
    }
    
    handoff_collection.insert_one(handoff_doc)

    return {"status": "success", "handoff_id": handoff_doc["handoff_id"], "message": "Case successfully sent to the legal team's dashboard!"}

# ---------------- GET PENDING HANDOFFS ----------------
@router.get("/lawyer/handoffs")
def get_handoffs():
    cases = list(handoff_collection.find().sort("created_at", -1).limit(50))
    for case in cases:
        case["_id"] = str(case["_id"])
        if "created_at" in case:
            case["created_at"] = str(case["created_at"])
    return {"status": "success", "handoffs": cases}

class HandoffResponseRequest(BaseModel):
    response_text: str

# ---------------- LAWYER RESPONDS TO HANDOFF ----------------
@router.post("/lawyer/handoffs/{handoff_id}/respond")
def respond_lawyer_handoff(handoff_id: str, request: HandoffResponseRequest):
    from bson.objectid import ObjectId
    try:
        result = handoff_collection.update_one(
            {"_id": ObjectId(handoff_id)},
            {"$set": {
                "status": "responded", 
                "lawyer_response": request.response_text,
                "responded_at": datetime.now()
            }}
        )
        if result.modified_count == 1:
            return {"status": "success", "message": "Response sent to user"}
    except Exception as e:
        print("Error updating handoff by ObjectId:", e)
        
    # Fallback to string handoff_id checking if ObjectId failed or didn't match
    result = handoff_collection.update_one(
        {"handoff_id": handoff_id},
        {"$set": {
            "status": "responded", 
            "lawyer_response": request.response_text,
            "responded_at": datetime.now()
        }}
    )
    if result.modified_count == 1:
        return {"status": "success", "message": "Response sent to user"}

    return {"status": "error", "message": "Handoff not found"}

# ---------------- USER GETS THEIR HANDOFFS ----------------
@router.get("/user/handoffs/{user_id}")
def get_user_handoffs(user_id: str):
    cases = list(handoff_collection.find({"user_id": user_id}).sort("created_at", -1).limit(50))
    for case in cases:
        case["_id"] = str(case["_id"])
        if "created_at" in case:
            case["created_at"] = str(case["created_at"])
        if "responded_at" in case:
            case["responded_at"] = str(case["responded_at"])
    return {"status": "success", "handoffs": cases}

# ---------------- USER MARKS HANDOFF AS READ ----------------
@router.post("/user/handoffs/{handoff_id}/read")
def read_user_handoff(handoff_id: str):
    from bson.objectid import ObjectId
    try:
        result = handoff_collection.update_one(
            {"_id": ObjectId(handoff_id)},
            {"$set": {"status": "read"}}
        )
        if result.modified_count == 1:
            return {"status": "success", "message": "Notification marked as read"}
    except Exception as e:
        print("Error marking handoff read by ObjectId:", e)
        
    result = handoff_collection.update_one(
        {"handoff_id": handoff_id},
        {"$set": {"status": "read"}}
    )
    if result.modified_count == 1:
        return {"status": "success", "message": "Notification marked as read"}

    return {"status": "error", "message": "Handoff not found"}