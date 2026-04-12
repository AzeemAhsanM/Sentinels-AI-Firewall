import requests
import os
from fastapi import APIRouter, HTTPException, Depends, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from database import get_db
from models import User
from security import create_token, decode_token
from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL

router = APIRouter(prefix="/auth")

GOOGLE_AUTH_URL = os.getenv("GOOGLE_AUTH_URL")
GOOGLE_TOKEN_URL = os.getenv("GOOGLE_TOKEN_URL")
GOOGLE_USERINFO = os.getenv("GOOGLE_USERINFO")
REDIRECT_URI = os.getenv("REDIRECT_URI")


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,
        samesite="none"
    )
    return {"success": True}


@router.get("/google")
def google_login():
    url = (
        f"{GOOGLE_AUTH_URL}"
        f"?client_id={GOOGLE_CLIENT_ID}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        f"&redirect_uri={REDIRECT_URI}"
        "&access_type=offline"
        "&prompt=consent"
    )
    return RedirectResponse(url)


@router.get("/google/callback")
def google_callback(
    code: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    if error or not code:
        return RedirectResponse(FRONTEND_URL)

    token_res = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        },
    )

    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Google token exchange failed")

    access_token = token_res.json()["access_token"]

    userinfo = requests.get(
        GOOGLE_USERINFO,
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()

    email = userinfo.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Unable to retrieve user email")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email)
        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = create_token(user.id)

    response = RedirectResponse(f"{FRONTEND_URL}/dashboard")
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 30  # 30 days
    )
    return response


@router.get("/refresh")
def refresh_token(request: Request, response: Response):
    """
    Called on every dashboard load.
    Reissues a fresh 30-day cookie as long as the current token is valid.
    Prevents sign-out while the user is actively using the app.
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not logged in")

    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    new_token = create_token(user_id)
    response.set_cookie(
        key="access_token",
        value=new_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 30
    )
    return {"ok": True}


@router.get("/token")
def get_token_for_extension(request: Request):
    """
    Returns JWT as plain JSON so the dashboard page can pass it
    to the Chrome extension. Cookie is httpOnly so JS can't read it directly.
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not logged in")

    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    return {"token": token}