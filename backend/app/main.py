import sys
import uuid
from pathlib import Path

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.append(str(BACKEND_DIR))

from app.auth import get_current_user, login, signup
from app.diagram_engine import generate_diagram, should_generate_diagram
from app.document_pipeline import ingest_document
from app.rag_engine import analyze_report, generate_response

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_UPLOAD_DIR = BACKEND_DIR / "temp_uploads"


class AskRequest(BaseModel):
    query: str


class AuthRequest(BaseModel):
    email: str
    password: str


def require_current_user(authorization: str | None = Header(default=None)) -> dict:
    """Read and validate a Bearer token from the Authorization header."""
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return get_current_user(token)


@app.post("/signup")
async def signup_user(req: AuthRequest):
    """Create a Helix AI user account."""
    return signup(req.email, req.password)


@app.post("/login")
async def login_user(req: AuthRequest):
    """Authenticate a Helix AI user and return a bearer token."""
    return login(req.email, req.password)


@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_current_user),
):
    """Save an uploaded document temporarily, ingest it, then remove the temp file."""
    TEMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    safe_filename = f"{uuid.uuid4().hex}_{Path(file.filename or 'uploaded_document').name}"
    temp_file_path = TEMP_UPLOAD_DIR / safe_filename

    try:
        contents = await file.read()
        temp_file_path.write_bytes(contents)

        chunks = ingest_document(current_user["user_id"], str(temp_file_path))
        return {"status": "success", "chunks_stored": len(chunks)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}") from exc
    finally:
        if temp_file_path.exists():
            temp_file_path.unlink()


@app.post("/ask")
async def ask_helix(req: AskRequest, current_user: dict = Depends(require_current_user)):
    """Answer a user query with either a generated diagram or RAG text response."""
    try:
        if should_generate_diagram(req.query):
            image_path = generate_diagram(current_user["user_id"], req.query)
            return FileResponse(image_path, media_type="image/png", filename=Path(image_path).name)

        response = generate_response(current_user["user_id"], req.query)
        return {"response": response}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ask request failed: {exc}") from exc


@app.post("/analyze")
async def analyze_uploaded_documents(current_user: dict = Depends(require_current_user)):
    """Analyze all uploaded medical documents for one user."""
    try:
        analysis = analyze_report(current_user["user_id"])
        return {"analysis": analysis}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analyze request failed: {exc}") from exc
