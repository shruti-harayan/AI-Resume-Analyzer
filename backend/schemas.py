#schemas.py
from pydantic import BaseModel,EmailStr

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    role: str
