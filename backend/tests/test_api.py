from fastapi import HTTPException
import pytest


@pytest.mark.asyncio
async def test_signup_returns_success(async_client, app_module, monkeypatch):
    monkeypatch.setattr(app_module, "signup", lambda email, password: {"message": "signup successful", "user_id": "123"})

    response = await async_client.post(
        "/signup",
        json={"email": "user@example.com", "password": "secret"},
    )

    assert response.status_code == 200
    assert response.json() == {"message": "signup successful", "user_id": "123"}


@pytest.mark.asyncio
async def test_signup_duplicate_email_returns_error(async_client, app_module, monkeypatch):
    def raise_duplicate(email, password):
        raise HTTPException(status_code=400, detail="Email already registered.")

    monkeypatch.setattr(app_module, "signup", raise_duplicate)

    response = await async_client.post(
        "/signup",
        json={"email": "user@example.com", "password": "secret"},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Email already registered."}


@pytest.mark.asyncio
async def test_login_returns_bearer_token(async_client, app_module, monkeypatch):
    monkeypatch.setattr(app_module, "login", lambda email, password: {"access_token": "jwt", "token_type": "bearer"})

    response = await async_client.post(
        "/login",
        json={"email": "user@example.com", "password": "secret"},
    )

    assert response.status_code == 200
    assert response.json() == {"access_token": "jwt", "token_type": "bearer"}


@pytest.mark.asyncio
async def test_login_invalid_credentials_returns_401(async_client, app_module, monkeypatch):
    def raise_invalid(email, password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    monkeypatch.setattr(app_module, "login", raise_invalid)

    response = await async_client.post(
        "/login",
        json={"email": "user@example.com", "password": "wrong"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password."}


@pytest.mark.asyncio
async def test_upload_valid_pdf_returns_success(async_client, app_module, monkeypatch, auth_headers):
    monkeypatch.setattr(app_module, "ingest_document", lambda user_id, path: ["one", "two", "three"])

    response = await async_client.post(
        "/upload",
        headers=auth_headers,
        files={"file": ("report.pdf", b"%PDF-1.4 fake pdf", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "success", "chunks_stored": 3}


@pytest.mark.asyncio
async def test_upload_valid_txt_returns_success(async_client, app_module, monkeypatch, auth_headers):
    monkeypatch.setattr(app_module, "ingest_document", lambda user_id, path: ["one", "two"])

    response = await async_client.post(
        "/upload",
        headers=auth_headers,
        files={"file": ("notes.txt", b"hemoglobin carries oxygen", "text/plain")},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "success", "chunks_stored": 2}


@pytest.mark.asyncio
async def test_upload_missing_file_returns_422(async_client, auth_headers):
    response = await async_client.post("/upload", headers=auth_headers)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_upload_missing_token_returns_401(async_client):
    response = await async_client.post(
        "/upload",
        files={"file": ("notes.txt", b"hemoglobin carries oxygen", "text/plain")},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Missing Authorization header."}


@pytest.mark.asyncio
async def test_upload_invalid_token_returns_401(async_client, app_module, monkeypatch):
    def raise_invalid_token(token):
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    monkeypatch.setattr(app_module, "get_current_user", raise_invalid_token)

    response = await async_client.post(
        "/upload",
        headers={"Authorization": "Bearer bad-token"},
        files={"file": ("notes.txt", b"hemoglobin carries oxygen", "text/plain")},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid or expired token."}


@pytest.mark.asyncio
async def test_upload_ingest_value_error_returns_400(async_client, app_module, monkeypatch, auth_headers):
    def raise_value_error(user_id, path):
        raise ValueError("unsupported file type")

    monkeypatch.setattr(app_module, "ingest_document", raise_value_error)

    response = await async_client.post(
        "/upload",
        headers=auth_headers,
        files={"file": ("image.png", b"png", "image/png")},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "unsupported file type"}


@pytest.mark.asyncio
async def test_upload_ingest_runtime_error_returns_500(async_client, app_module, monkeypatch, auth_headers):
    def raise_runtime_error(user_id, path):
        raise RuntimeError("embedding failed")

    monkeypatch.setattr(app_module, "ingest_document", raise_runtime_error)

    response = await async_client.post(
        "/upload",
        headers=auth_headers,
        files={"file": ("notes.txt", b"text", "text/plain")},
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "embedding failed"}


@pytest.mark.asyncio
async def test_ask_normal_query_returns_response(async_client, app_module, monkeypatch, auth_headers):
    monkeypatch.setattr(app_module, "should_generate_diagram", lambda query: False)
    monkeypatch.setattr(app_module, "generate_response", lambda user_id, query: "normal answer")

    response = await async_client.post(
        "/ask",
        headers=auth_headers,
        json={"query": "what is hemoglobin?"},
    )

    assert response.status_code == 200
    assert response.json() == {"response": "normal answer"}


@pytest.mark.asyncio
async def test_ask_diagram_query_returns_png(async_client, app_module, monkeypatch, tmp_path, auth_headers):
    image_path = tmp_path / "diagram.png"
    image_path.write_bytes(b"fake png bytes")
    monkeypatch.setattr(app_module, "should_generate_diagram", lambda query: True)
    monkeypatch.setattr(app_module, "generate_diagram", lambda user_id, query: str(image_path))

    response = await async_client.post(
        "/ask",
        headers=auth_headers,
        json={"query": "draw a cell diagram"},
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content == b"fake png bytes"


@pytest.mark.asyncio
async def test_ask_missing_query_returns_422(async_client, auth_headers):
    response = await async_client.post("/ask", headers=auth_headers, json={})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_ask_missing_token_returns_401(async_client):
    response = await async_client.post("/ask", json={"query": "hello"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Missing Authorization header."}


@pytest.mark.asyncio
async def test_ask_generate_response_runtime_error_returns_500(async_client, app_module, monkeypatch, auth_headers):
    def raise_runtime_error(user_id, query):
        raise RuntimeError("rag failed")

    monkeypatch.setattr(app_module, "should_generate_diagram", lambda query: False)
    monkeypatch.setattr(app_module, "generate_response", raise_runtime_error)

    response = await async_client.post(
        "/ask",
        headers=auth_headers,
        json={"query": "what is hemoglobin?"},
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "rag failed"}


@pytest.mark.asyncio
async def test_ask_generate_diagram_runtime_error_returns_500(async_client, app_module, monkeypatch, auth_headers):
    def raise_runtime_error(user_id, query):
        raise RuntimeError("diagram failed")

    monkeypatch.setattr(app_module, "should_generate_diagram", lambda query: True)
    monkeypatch.setattr(app_module, "generate_diagram", raise_runtime_error)

    response = await async_client.post(
        "/ask",
        headers=auth_headers,
        json={"query": "draw a cell"},
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "diagram failed"}


@pytest.mark.asyncio
async def test_analyze_valid_request_returns_analysis(async_client, app_module, monkeypatch, auth_headers):
    monkeypatch.setattr(app_module, "analyze_report", lambda user_id: "medical analysis")

    response = await async_client.post("/analyze", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == {"analysis": "medical analysis"}


@pytest.mark.asyncio
async def test_analyze_missing_token_returns_401(async_client):
    response = await async_client.post("/analyze")

    assert response.status_code == 401
    assert response.json() == {"detail": "Missing Authorization header."}


@pytest.mark.asyncio
async def test_analyze_runtime_error_returns_500(async_client, app_module, monkeypatch, auth_headers):
    def raise_runtime_error(user_id):
        raise RuntimeError("analysis failed")

    monkeypatch.setattr(app_module, "analyze_report", raise_runtime_error)

    response = await async_client.post("/analyze", headers=auth_headers)

    assert response.status_code == 500
    assert response.json() == {"detail": "analysis failed"}
