from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    aadhaar: str = None
    is_adult: bool = True
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str