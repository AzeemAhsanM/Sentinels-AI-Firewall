from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from database import get_db
from models import PromptLog
from security import get_current_user

router = APIRouter()

class AnalyzeRequest(BaseModel):
    prompt: str

@router.post("/analyze")
def analyze(
    req: Request,
    request: AnalyzeRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user_id = get_current_user(req)

    log = PromptLog(
        user_id=user_id,
        risk_score=0.0,
        risk_level="logged",
        entity_count=0,
        entity_types="[]"
    )

    db.add(log)
    db.commit()

    return {"status": "logged"}