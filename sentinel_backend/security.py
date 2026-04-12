from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Request
from config import JWT_SECRET

ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


def create_token(user_id: int):

    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS),
        "iat": datetime.utcnow()
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str):

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload["user_id"]

    except JWTError:
        return None


def get_current_user(request: Request):

    token = request.cookies.get("access_token")

    if not token:
        return None

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload["user_id"]

    except JWTError:
        raise Exception("Invalid token")