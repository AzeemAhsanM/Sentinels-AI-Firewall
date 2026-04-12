from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from database import engine, Base
from auth import router as auth_router
from analyze import router as analyze_router
from dashboard import router as dashboard_router
from Log import router as log_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sentinels API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(analyze_router)
app.include_router(dashboard_router)
app.include_router(log_router)

@app.get("/")
def health():
    return {"status": "running"}

handler = Mangum(app)