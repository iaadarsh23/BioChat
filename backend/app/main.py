from fastapi import FastAPI
from pydantic import BaseModel
from .llms.llm import generatedLLMResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os


def get_allowed_origins():
    raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def llmResponse(req: ChatRequest):
    try:
        reply = await asyncio.to_thread(generatedLLMResponse, req.message)
        return {"BioChat": reply}
    except Exception as e:
        return {"error": str(e)}
