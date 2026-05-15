import hashlib
import re
from pathlib import Path
from typing import Iterable

import chromadb
import tiktoken
from dotenv import load_dotenv
from openai import OpenAI
from pypdf import PdfReader

load_dotenv()

EMBEDDING_MODEL = "text-embedding-3-small"
CHUNK_SIZE_TOKENS = 500
CHUNK_OVERLAP_TOKENS = 50
SUPPORTED_EXTENSIONS = {".pdf", ".txt"}
CHROMA_PATH = Path(__file__).resolve().parents[1] / "chroma_db"

_openai_client: OpenAI | None = None
_tokenizer = tiktoken.get_encoding("cl100k_base")


def ingest_document(user_id: str, file_path: str) -> list[str]:
    """Extract, chunk, embed, and store a PDF or TXT document for one user."""
    clean_user_id = _validate_user_id(user_id)
    path = _validate_file_path(file_path)

    raw_text = _extract_text(path)
    cleaned_text = _clean_text(raw_text)
    if not cleaned_text:
        raise ValueError("Document is empty after text extraction and cleaning.")

    chunks = _chunk_text(cleaned_text)
    if not chunks:
        raise ValueError("Document did not contain enough text to create chunks.")

    embeddings = _embed_texts(chunks)
    _store_chunks(clean_user_id, path, chunks, embeddings)

    return chunks


def query_documents(user_id: str, query_text: str, top_k: int = 5) -> list[str]:
    """Return the top K document chunks most relevant to a user's query."""
    clean_user_id = _validate_user_id(user_id)
    if not query_text or not query_text.strip():
        raise ValueError("query_text must not be empty.")
    if top_k <= 0:
        raise ValueError("top_k must be greater than 0.")

    query_embedding = _embed_texts([query_text.strip()])[0]
    collection = _get_collection(clean_user_id)

    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents"],
        )
    except Exception as exc:
        raise RuntimeError(f"Failed to query ChromaDB collection: {exc}") from exc

    documents = results.get("documents") or []
    if not documents:
        return []

    return [chunk for chunk in documents[0] if isinstance(chunk, str)]


def _validate_user_id(user_id: str) -> str:
    """Normalize user IDs so each user maps to a safe, isolated collection."""
    if not user_id or not user_id.strip():
        raise ValueError("user_id must not be empty.")

    sanitized = re.sub(r"[^a-zA-Z0-9_-]+", "_", user_id.strip())
    sanitized = sanitized.strip("_-")
    if not sanitized:
        raise ValueError("user_id must contain at least one letter or number.")

    return sanitized


def _validate_file_path(file_path: str) -> Path:
    """Confirm that the input file exists and uses a supported extension."""
    if not file_path or not file_path.strip():
        raise ValueError("file_path must not be empty.")

    path = Path(file_path).expanduser().resolve()
    if not path.exists() or not path.is_file():
        raise ValueError(f"File does not exist: {file_path}")
    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError("Unsupported file type. Only PDF and TXT files are supported.")

    return path


def _extract_text(path: Path) -> str:
    """Read text from a supported file type."""
    if path.suffix.lower() == ".pdf":
        return _extract_pdf_text(path)
    if path.suffix.lower() == ".txt":
        return _extract_txt_text(path)

    raise ValueError("Unsupported file type. Only PDF and TXT files are supported.")


def _extract_pdf_text(path: Path) -> str:
    """Extract text from every page in a PDF with pypdf."""
    try:
        reader = PdfReader(str(path))
        page_text = [page.extract_text() or "" for page in reader.pages]
    except Exception as exc:
        raise RuntimeError(f"Failed to extract text from PDF: {exc}") from exc

    return "\n".join(page_text)


def _extract_txt_text(path: Path) -> str:
    """Extract text from a TXT file, tolerating imperfect encodings."""
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception as exc:
        raise RuntimeError(f"Failed to extract text from TXT file: {exc}") from exc


def _clean_text(text: str) -> str:
    """Normalize whitespace while preserving readable document content."""
    text = text.replace("\x00", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _chunk_text(text: str) -> list[str]:
    """Split text into token windows with overlap for retrieval context."""
    tokens = _tokenizer.encode(text)
    if not tokens:
        return []

    chunks: list[str] = []
    step = CHUNK_SIZE_TOKENS - CHUNK_OVERLAP_TOKENS

    for start in range(0, len(tokens), step):
        end = start + CHUNK_SIZE_TOKENS
        chunk_tokens = tokens[start:end]
        if not chunk_tokens:
            continue

        chunk_text = _tokenizer.decode(chunk_tokens).strip()
        if chunk_text:
            chunks.append(chunk_text)

        if end >= len(tokens):
            break

    return chunks


def _embed_texts(texts: Iterable[str]) -> list[list[float]]:
    """Generate OpenAI embeddings for document chunks or queries."""
    inputs = [text for text in texts if text and text.strip()]
    if not inputs:
        raise ValueError("No text provided for embedding.")

    try:
        response = _get_openai_client().embeddings.create(
            model=EMBEDDING_MODEL,
            input=inputs,
        )
    except Exception as exc:
        raise RuntimeError(f"OpenAI embedding generation failed: {exc}") from exc

    return [item.embedding for item in response.data]


def _get_openai_client() -> OpenAI:
    """Create the OpenAI client lazily so imports stay lightweight and testable."""
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI()
    return _openai_client


def _get_collection(user_id: str):
    """Create or load one persistent ChromaDB collection per user."""
    client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    collection_name = f"helix_user_{user_id}"
    return client.get_or_create_collection(name=collection_name)


def _store_chunks(
    user_id: str,
    path: Path,
    chunks: list[str],
    embeddings: list[list[float]],
) -> None:
    """Persist chunk text, embeddings, and metadata in ChromaDB."""
    if len(chunks) != len(embeddings):
        raise RuntimeError("Embedding count does not match chunk count.")

    collection = _get_collection(user_id)
    filename = path.name
    source_path = str(path)
    document_hash = hashlib.sha256(source_path.encode("utf-8")).hexdigest()[:16]

    ids = [f"{document_hash}_{index}" for index in range(len(chunks))]
    metadatas = [
        {
            "user_id": user_id,
            "filename": filename,
            "chunk_index": index,
            "source_path": source_path,
        }
        for index in range(len(chunks))
    ]

    try:
        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
        )
    except Exception as exc:
        raise RuntimeError(f"Failed to store chunks in ChromaDB: {exc}") from exc
