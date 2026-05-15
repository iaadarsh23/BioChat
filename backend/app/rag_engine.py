from dotenv import load_dotenv
from openai import OpenAI

from app.document_pipeline import query_documents

load_dotenv()

CHAT_MODEL = "gpt-4o"
SYSTEM_MESSAGE = (
    "You are Helix AI, a domain-specific biology and medical assistant. "
    "You are precise, factual, and cautious. When analyzing medical reports "
    "or lab results, always mention normal reference ranges, flag anomalies "
    "clearly, and recommend consulting a doctor for final diagnosis. "
    "Never guess. If unsure, say so."
)
NO_CONTEXT_MESSAGE = (
    "No personal documents were found for this query. Answer using general "
    "biology and medical knowledge, and clearly mention that no personal "
    "document context was available."
)
REPORT_ANALYSIS_QUERY = (
    "Summarize all key findings, diagnoses, abnormal values, and "
    "recommendations from the uploaded medical documents."
)

_openai_client: OpenAI | None = None


def generate_response(user_id: str, user_query: str) -> str:
    """Generate a RAG answer using a user's stored document chunks as context."""
    if not user_query or not user_query.strip():
        raise ValueError("user_query must not be empty.")

    context_chunks = query_documents(user_id, user_query, top_k=5)
    context_block = _build_context_block(context_chunks)

    try:
        response = _get_openai_client().chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_MESSAGE},
                {"role": "user", "content": context_block},
                {"role": "user", "content": user_query.strip()},
            ],
        )
    except Exception as exc:
        raise RuntimeError(f"OpenAI RAG response generation failed: {exc}") from exc

    response_text = response.choices[0].message.content
    return response_text or ""


def analyze_report(user_id: str) -> str:
    """Summarize uploaded medical documents for key findings and next steps."""
    return generate_response(user_id, REPORT_ANALYSIS_QUERY)


def _build_context_block(context_chunks: list[str]) -> str:
    """Format retrieved chunks as the user's document context."""
    if not context_chunks:
        context_text = NO_CONTEXT_MESSAGE
    else:
        context_text = "\n\n".join(context_chunks)

    return f"User's Document Context:\n{context_text}"


def _get_openai_client() -> OpenAI:
    """Create the OpenAI client lazily so imports stay lightweight and testable."""
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI()
    return _openai_client
