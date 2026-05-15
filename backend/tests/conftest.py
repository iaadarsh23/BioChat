import sys
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import main as main_app


@pytest.fixture(autouse=True)
def mock_backend_calls(monkeypatch):
    """Keep API tests isolated from OpenAI, ChromaDB, and generated code."""
    monkeypatch.setattr(main_app, "ingest_document", lambda user_id, path: ["chunk"])
    monkeypatch.setattr(main_app, "should_generate_diagram", lambda query: False)
    monkeypatch.setattr(main_app, "generate_response", lambda user_id, query: "mock response")
    monkeypatch.setattr(main_app, "generate_diagram", lambda user_id, query: "mock_diagram.png")
    monkeypatch.setattr(main_app, "analyze_report", lambda user_id: "mock analysis")
    monkeypatch.setattr(main_app, "get_current_user", lambda token: {"user_id": "user_001", "email": "user@example.com"})
    monkeypatch.setattr(main_app, "signup", lambda email, password: {"message": "signup successful", "user_id": "user_001"})
    monkeypatch.setattr(main_app, "login", lambda email, password: {"access_token": "test-token", "token_type": "bearer"})

    import app.document_pipeline as document_pipeline
    import app.rag_engine as rag_engine

    monkeypatch.setattr(document_pipeline, "query_documents", lambda user_id, query, top_k=5: [])
    monkeypatch.setattr(rag_engine, "query_documents", lambda user_id, query, top_k=5: [])


@pytest.fixture
def app_module():
    return main_app


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer test-token"}


@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=main_app.app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
