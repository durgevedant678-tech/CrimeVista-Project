import hashlib
import hmac
import os
import time
from typing import Annotated

from fastapi import HTTPException, Request, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer(auto_error=False)
ADMIN_SESSION_COOKIE = "crimevista_admin_session"
ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30


def app_environment() -> str:
    return os.getenv("APP_ENV", "development").strip().lower()


def get_expected_api_token() -> str:
    token = os.getenv("API_ADMIN_TOKEN", "").strip()
    if app_environment() == "production" and not token:
        raise RuntimeError(
            "API_ADMIN_TOKEN is required in production. Configure it in the Render environment variables."
        )
    return token


def create_admin_session(api_token: str, *, now: int | None = None) -> tuple[str, int]:
    expires_at = (int(time.time()) if now is None else now) + ADMIN_SESSION_TTL_SECONDS
    payload = str(expires_at)
    signature = hmac.new(
        api_token.encode("utf-8"),
        f"crimevista-admin-session:{payload}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload}.{signature}", expires_at


def is_valid_admin_session(
    session: str | None,
    api_token: str,
    *,
    now: int | None = None,
) -> bool:
    if not session or not api_token:
        return False

    try:
        expires_text, signature = session.split(".", 1)
        expires_at = int(expires_text)
    except (ValueError, TypeError):
        return False

    current_time = int(time.time()) if now is None else now
    if expires_at <= current_time:
        return False

    expected_signature = hmac.new(
        api_token.encode("utf-8"),
        f"crimevista-admin-session:{expires_text}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(signature, expected_signature)


def require_api_token(
    request: Request,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Security(bearer_scheme),
    ] = None,
) -> str:
    expected_token = get_expected_api_token()
    if not expected_token and app_environment() != "production":
        return ""

    if credentials is not None and hmac.compare_digest(
        credentials.credentials, expected_token
    ):
        return credentials.credentials

    session = request.cookies.get(ADMIN_SESSION_COOKIE)
    if is_valid_admin_session(session, expected_token):
        return "admin-session"

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
        headers={"WWW-Authenticate": "Bearer"},
    )
