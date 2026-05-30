from fastapi import APIRouter
from app.services.llm_service import get_available_providers

router = APIRouter()


@router.get("/providers")
async def list_providers():
    return await get_available_providers()
