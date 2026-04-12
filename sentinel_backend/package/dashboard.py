from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from security import decode_token
from database import get_db
from models import PromptLog

router = APIRouter(prefix="/dashboard")


@router.get("")
def dashboard(request: Request, db: Session = Depends(get_db)):

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

    total = db.query(PromptLog).filter(PromptLog.user_id == user_id).count()

    high = db.query(PromptLog).filter(
        PromptLog.user_id == user_id,
        PromptLog.risk_level == "high"
    ).count()

    medium = db.query(PromptLog).filter(
        PromptLog.user_id == user_id,
        PromptLog.risk_level == "medium"
    ).count()

    low = db.query(PromptLog).filter(
        PromptLog.user_id == user_id,
        PromptLog.risk_level == "low"
    ).count()

    return {
        "total": total,
        "high": high,
        "medium": medium,
        "low": low
    }