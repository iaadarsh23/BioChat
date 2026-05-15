from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import auth as auth_module


@pytest.fixture
def real_auth(monkeypatch, app_module):
    """Use real auth functions with an isolated in-memory SQLite database."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key")

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    auth_module.Base.metadata.create_all(bind=engine)

    monkeypatch.setattr(auth_module, "SessionLocal", TestingSessionLocal)
    monkeypatch.setattr(app_module, "signup", auth_module.signup)
    monkeypatch.setattr(app_module, "login", auth_module.login)
    monkeypatch.setattr(app_module, "get_current_user", auth_module.get_current_user)

    return auth_module


async def _signup(async_client, email="user@example.com", password="secret-password"):
    return await async_client.post(
        "/signup",
        json={"email": email, "password": password},
    )


async def _login(async_client, email="user@example.com", password="secret-password"):
    return await async_client.post(
        "/login",
        json={"email": email, "password": password},
    )


async def _create_token(async_client, email="user@example.com", password="secret-password"):
    await _signup(async_client, email=email, password=password)
    response = await _login(async_client, email=email, password=password)
    return response.json()["access_token"]


def _expired_token(user_id="1", email="user@example.com"):
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
    }
    return jwt.encode(payload, "test-secret-key", algorithm=auth_module.JWT_ALGORITHM)


@pytest.mark.asyncio
async def test_signup_valid_email_and_password_returns_user_id(async_client, real_auth):
    response = await _signup(async_client)

    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "signup successful"
    assert isinstance(body["user_id"], str)


@pytest.mark.asyncio
async def test_signup_duplicate_email_returns_400(async_client, real_auth):
    await _signup(async_client)

    response = await _signup(async_client)

    assert response.status_code == 400
    assert response.json() == {"detail": "Email already registered."}


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", [{"password": "secret-password"}, {"email": "user@example.com"}])
async def test_signup_missing_email_or_password_returns_422(async_client, real_auth, payload):
    response = await async_client.post("/signup", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_valid_credentials_return_bearer_token(async_client, real_auth):
    await _signup(async_client)

    response = await _login(async_client)

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["access_token"], str)
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(async_client, real_auth):
    await _signup(async_client)

    response = await _login(async_client, password="wrong-password")

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password."}


@pytest.mark.asyncio
async def test_login_nonexistent_email_returns_401(async_client, real_auth):
    response = await _login(async_client, email="missing@example.com")

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password."}


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", [{"password": "secret-password"}, {"email": "user@example.com"}])
async def test_login_missing_fields_returns_422(async_client, real_auth, payload):
    response = await async_client.post("/login", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("method", "url", "kwargs"),
    [
        ("post", "/upload", {"files": {"file": ("notes.txt", b"text", "text/plain")}}),
        ("post", "/ask", {"json": {"query": "what is hemoglobin?"}}),
        ("post", "/analyze", {}),
    ],
)
async def test_protected_routes_without_authorization_return_401(async_client, real_auth, method, url, kwargs):
    response = await getattr(async_client, method)(url, **kwargs)

    assert response.status_code == 401
    assert response.json() == {"detail": "Missing Authorization header."}


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("method", "url", "kwargs"),
    [
        ("post", "/upload", {"files": {"file": ("notes.txt", b"text", "text/plain")}}),
        ("post", "/ask", {"json": {"query": "what is hemoglobin?"}}),
        ("post", "/analyze", {}),
    ],
)
async def test_protected_routes_with_invalid_token_return_401(async_client, real_auth, method, url, kwargs):
    response = await getattr(async_client, method)(
        url,
        headers={"Authorization": "Bearer invalid-token"},
        **kwargs,
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid or expired token."}


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("method", "url", "kwargs"),
    [
        ("post", "/upload", {"files": {"file": ("notes.txt", b"text", "text/plain")}}),
        ("post", "/ask", {"json": {"query": "what is hemoglobin?"}}),
        ("post", "/analyze", {}),
    ],
)
async def test_protected_routes_with_expired_token_return_401(async_client, real_auth, method, url, kwargs):
    response = await getattr(async_client, method)(
        url,
        headers={"Authorization": f"Bearer {_expired_token()}"},
        **kwargs,
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid or expired token."}


@pytest.mark.asyncio
async def test_upload_with_valid_token_succeeds(async_client, real_auth):
    token = await _create_token(async_client)

    response = await async_client.post(
        "/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("notes.txt", b"text", "text/plain")},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "success", "chunks_stored": 1}


@pytest.mark.asyncio
async def test_ask_with_valid_token_succeeds(async_client, real_auth):
    token = await _create_token(async_client)

    response = await async_client.post(
        "/ask",
        headers={"Authorization": f"Bearer {token}"},
        json={"query": "what is hemoglobin?"},
    )

    assert response.status_code == 200
    assert response.json() == {"response": "mock response"}


@pytest.mark.asyncio
async def test_analyze_with_valid_token_succeeds(async_client, real_auth):
    token = await _create_token(async_client)

    response = await async_client.post(
        "/analyze",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json() == {"analysis": "mock analysis"}
