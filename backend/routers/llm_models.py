from fastapi import APIRouter, Depends
from llm.model_discovery import list_available_chat_models, list_available_embedding_models
from schemas import ProviderModelsResponse, EmbeddingModelsResponse
from services.user_service import get_current_user

router = APIRouter(prefix="/llm_models", tags=["LLM Models"])


@router.get("/chat", response_model=ProviderModelsResponse)
async def get_chat_providers(current_user=Depends(get_current_user)):
    """Get all chat providers and models."""
    return ProviderModelsResponse(providers=list_available_chat_models())


'''
@router.get("/embedding", response_model=ProviderModelsResponse)
async def get_embedding_providers(current_user=Depends(get_current_user)):
    """Get all embedding providers and models."""
    return ProviderModelsResponse(providers=list_available_embedding_models())
'''


@router.get("/embedding", response_model=EmbeddingModelsResponse)
async def get_embedding_providers(current_user=Depends(get_current_user)):
    return EmbeddingModelsResponse(models=list_available_embedding_models())
