import re
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

CHAT_MODEL = "gpt-4o"
SYSTEM_MESSAGE = (
    "You are a biology and medical diagram generator. When given a request, "
    "respond ONLY with valid, executable Python code using matplotlib that "
    "generates a clear, labeled diagram. Do not include any explanation, "
    "markdown, or code fences. Just raw Python code. The code must save the "
    "figure to a file path provided in a variable called `output_path` which "
    "will be injected before your code runs. Use plt.savefig(output_path) "
    "at the end. Do not call plt.show()."
)
DIAGRAM_KEYWORDS = ("diagram", "visualize", "chart", "plot", "graph", "show me", "draw")
BACKEND_DIR = Path(__file__).resolve().parents[1]
DIAGRAMS_DIR = BACKEND_DIR / "diagrams"

_openai_client: OpenAI | None = None


def generate_diagram(user_id: str, user_query: str) -> str:
    """Generate a matplotlib diagram image and return its saved file path."""
    clean_user_id = _validate_user_id(user_id)
    if not user_query or not user_query.strip():
        raise ValueError("user_query must not be empty.")

    generated_code = _request_diagram_code(user_query.strip())
    raw_code = _extract_raw_python_code(generated_code)
    output_path = _build_output_path(clean_user_id)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # The generated code is instructed to save the figure to this exact variable.
    executable_code = f'output_path = r"{output_path}"\n{raw_code}'
    exec_namespace: dict[str, object] = {}

    try:
        exec(executable_code, exec_namespace, exec_namespace)
    except Exception as exc:
        raise RuntimeError(f"Failed to execute generated diagram code: {exc}") from exc

    if not output_path.exists():
        raise RuntimeError(f"Generated diagram code did not create output file: {output_path}")

    return str(output_path)


def should_generate_diagram(user_query: str) -> bool:
    """Return True when a query asks for a visual/diagram-style response."""
    if not user_query:
        return False

    normalized_query = user_query.lower()
    return any(keyword in normalized_query for keyword in DIAGRAM_KEYWORDS)


def _request_diagram_code(user_query: str) -> str:
    """Ask OpenAI for raw matplotlib code that creates the requested diagram."""
    try:
        response = _get_openai_client().chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_MESSAGE},
                {"role": "user", "content": user_query},
            ],
        )
    except Exception as exc:
        raise RuntimeError(f"OpenAI diagram code generation failed: {exc}") from exc

    code = response.choices[0].message.content
    if not code or not code.strip():
        raise RuntimeError("OpenAI diagram code generation returned empty code.")

    return code


def _extract_raw_python_code(response_text: str) -> str:
    """Remove accidental markdown fences while preserving executable Python."""
    code = response_text.strip()

    if code.startswith("```"):
        code = re.sub(r"^```(?:python)?\s*", "", code, flags=re.IGNORECASE)
        code = re.sub(r"\s*```$", "", code)

    return code.strip()


def _build_output_path(user_id: str) -> Path:
    """Create the timestamped output path under backend/diagrams/{user_id}/."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    return DIAGRAMS_DIR / user_id / f"diagram_{timestamp}.png"


def _validate_user_id(user_id: str) -> str:
    """Normalize user IDs so diagram files stay in a safe user directory."""
    if not user_id or not user_id.strip():
        raise ValueError("user_id must not be empty.")

    sanitized = re.sub(r"[^a-zA-Z0-9_-]+", "_", user_id.strip())
    sanitized = sanitized.strip("_-")
    if not sanitized:
        raise ValueError("user_id must contain at least one letter or number.")

    return sanitized


def _get_openai_client() -> OpenAI:
    """Create the OpenAI client lazily so imports stay lightweight and testable."""
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI()
    return _openai_client
