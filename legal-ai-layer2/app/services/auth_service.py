from passlib.context import CryptContext
from app.api.database import users_collection
from datetime import datetime, timedelta
import os

try:
    import jwt
    from jwt import PyJWTError
except ImportError:
    try:
        from jose import jwt
        from jose.exceptions import JWTError as PyJWTError
    except ImportError:
        jwt = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-key-legal-ai-12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days


def hash_password(password):
    return pwd_context.hash(password[:72])


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict):
    if not jwt:
        return "mock_token_" + str(data.get("sub"))
        
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    if not jwt:
        return {"sub": "user@example.com", "role": "user"}
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None