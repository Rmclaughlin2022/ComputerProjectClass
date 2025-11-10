import os
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()


SECRET_KEY = os.getenv("JWT_SECRET", "dev_secret_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

_pwd = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return _pwd.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return _pwd.verify(password, hashed)

def create_access_token(data: dict, minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=minutes)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
