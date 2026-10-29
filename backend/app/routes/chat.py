from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.chat_service import generate_chat_response

router = APIRouter()


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    page: str | None = None
    filters: dict[str, object] = Field(default_factory=dict)
    selectedArea: str | None = None
    selectedIncident: dict[str, object] | None = None


@router.post("/chat")
async def chat(request: ChatMessageRequest):
    return await generate_chat_response(request.model_dump())
