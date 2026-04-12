from pydantic import BaseModel
from typing import List


class LogRequest(BaseModel):
    risk_score: float
    risk_level: str
    entity_count: int
    entity_types: List[str]


class DashboardResponse(BaseModel):
    total: int
    high: int
    medium: int
    low: int