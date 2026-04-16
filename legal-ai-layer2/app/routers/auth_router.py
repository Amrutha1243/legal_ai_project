from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from app.api.database import users_collection
from app.models.user_model import UserRegister, UserLogin
from app.services.auth_service import hash_password, verify_password, create_access_token, verify_token
from app.services.recommendation.lawyer_recommender import recommend_lawyers

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = users_collection.find_one({"email": payload.get("sub")})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ================================
# AADHAAR VERHOEFF CHECK
# ================================
d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], 
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], 
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], 
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], 
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]
p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], 
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], 
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], 
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

def validate_verhoeff(num: str) -> bool:
    if not num or len(num) != 12 or not num.isdigit():
        return False
    try:
        c = 0
        arr = [int(x) for x in str(num)][::-1]
        for i in range(len(arr)):
            c = d[c][p[i % 8][arr[i]]]
        return c == 0
    except Exception:
        return False

# ================================
# EMAIL OTP VERIFICATION
# ================================
from pydantic import BaseModel, EmailStr

class EmailRequest(BaseModel):
    email: EmailStr

class EmailVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv() # Load Environment Variables from .env file

# Temporary In-Memory Store for Real OTPs
# (In production, use Redis or MongoDB with a TTL index)
real_otp_store = {}

def send_real_email_otp(receiver_email: str, otp_code: str):
    sender_email = os.getenv("SMTP_EMAIL", "")
    sender_password = os.getenv("SMTP_PASSWORD", "")
    
    # If user hasn't set up credentials, print to console so they can still test
    print(f"\n==========================================")
    print(f"📧 EMAIL OTP GENERATED FOR: {receiver_email}")
    print(f"🔑 OTP CODE: {otp_code}")
    print(f"==========================================\n")
    
    if not sender_email or not sender_password:
        print("⚠️ Warning: SMTP_EMAIL or SMTP_PASSWORD not set in .env! Printing to console instead.")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = "Your Legal AI Verification Code"
        
        body = f"""
        Hello,
        
        Your verification code for the Legal AI Platform is: {otp_code}
        
        Please do not share this code with anyone.
        
        Thanks,
        Legal AI Team
        """
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, receiver_email, text)
        server.quit()
        return True
    except Exception as e:
        print("❌ SMTP Error sending email:", e)
        return False

@router.post("/email/generate-otp")
def generate_email_otp(req: EmailRequest):
    user_email = str(req.email).lower()
    existing = users_collection.find_one({"email": user_email})
    if existing:
        raise HTTPException(status_code=400, detail="Account with this email already exists.")
        
    # Generate real 6-digit OTP
    generated_otp = str(random.randint(100000, 999999))
    
    # Store it in memory
    real_otp_store[user_email] = generated_otp
    
    # Try to send email
    email_sent = send_real_email_otp(user_email, generated_otp)
    
    msg = f"OTP successfully sent to {user_email}"
    if not email_sent:
        msg = "⚠️ SMTP not configured! OTP printed to your backend Terminal for testing."
        
    return {
        "status": "success", 
        "message": msg
    }

@router.post("/email/generate-login-otp")
def generate_login_otp(req: EmailRequest):
    user_email = str(req.email).lower()
    existing = users_collection.find_one({"email": user_email})
    if not existing:
        raise HTTPException(status_code=404, detail="Account not found.")
        
    generated_otp = str(random.randint(100000, 999999))
    real_otp_store[user_email] = generated_otp
    email_sent = send_real_email_otp(user_email, generated_otp)
    
    msg = f"OTP successfully sent to {user_email}"
    if not email_sent:
        msg = "⚠️ SMTP not configured! OTP printed to your backend Terminal for testing."
        
    return {"status": "success", "message": msg}


@router.post("/email/verify-otp")
def verify_email_otp(req: EmailVerifyRequest):
    user_email = str(req.email).lower()
    stored_otp = real_otp_store.get(user_email)
    
    if not stored_otp:
        raise HTTPException(status_code=400, detail="OTP session expired or not generated. Try again.")
        
    if req.otp != stored_otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP.")
        
    # Clear OTP after successful verification
    del real_otp_store[user_email]
        
    return {"status": "success", "message": "Email verified successfully."}

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

@router.post("/email/reset-password")
def reset_password(req: ResetPasswordRequest):
    user_email = str(req.email).lower()
    stored_otp = real_otp_store.get(user_email)
    
    if not stored_otp or req.otp != stored_otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
        
    db_user = users_collection.find_one({"email": user_email})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    # Update password
    hashed_pw = hash_password(req.new_password)
    users_collection.update_one({"email": user_email}, {"$set": {"password": hashed_pw}})
    
    # Clear OTP after successful reset
    del real_otp_store[user_email]
    
    return {"status": "success", "message": "Password reset successfully."}


@router.post("/register")
def register(user: UserRegister):
    
    if not user.is_adult:
        raise HTTPException(status_code=403, detail="Age Restriction: You must agree to the Over-18 Terms of Service.")

    if not user.aadhaar or not validate_verhoeff(user.aadhaar):
        raise HTTPException(status_code=400, detail="Invalid Aadhaar Number format or checksum.")

    user_email = str(user.email).lower()
    existing = users_collection.find_one({"email": user_email})

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user_dict = user.dict()
    user_dict["email"] = user_email
    user_dict["password"] = hash_password(user.password)

    users_collection.insert_one(user_dict)

    return {"message": "User registered successfully"}


@router.post("/login")
def login(user: UserLogin):
    user_email = str(user.email).lower()
    db_user = users_collection.find_one({"email": user_email})

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")
        
    # Generate Real JWT Token
    access_token = create_access_token(
        data={"sub": db_user["email"], "role": db_user["role"]}
    )

    return {
        "message": "Login successful",
        "role": db_user["role"],
        "name": db_user.get("name", "User"),
        "token": access_token
    }

@router.post("/chat")
async def chat(data: dict):

    query = data.get("user_query")

    # your existing AI response
    ai_response = "your AI response here"

    # 🔥 ADD THIS LINE
    lawyers = recommend_lawyers(query)

    return {
        "message": ai_response,
        "lawyers": lawyers   # 🔥 THIS IS MISSING IN YOUR PROJECT
    }