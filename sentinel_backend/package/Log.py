from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
import json

from database import get_db
from models import PromptLog
from schemas import LogRequest
from security import decode_token

router = APIRouter()

@router.post("/log")
def log_scan(request: Request, body: LogRequest, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token") or \
            request.headers.get("Authorization", "").replace("Bearer ", "")

    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        user_id = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    log = PromptLog(
        user_id=user_id,
        risk_score=body.risk_score,
        risk_level=body.risk_level,
    )
    db.add(log)
    db.commit()

    return {"status": "logged"}