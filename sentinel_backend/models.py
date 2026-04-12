from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)


class PromptLog(Base):
    __tablename__ = "prompt_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    risk_score = Column(Float)
    risk_level = Column(String)
    entity_count = Column(Integer, default=0)
    entity_types = Column(String, default="[]")
    created_at = Column(DateTime, server_default=func.now())