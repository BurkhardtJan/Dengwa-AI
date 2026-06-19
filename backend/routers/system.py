from fastapi import APIRouter

router = APIRouter(tags=["System"])


@router.get("/health")
async def root():
    """Health check of the Website"""
    return {"message": "Immersio AI running"}
