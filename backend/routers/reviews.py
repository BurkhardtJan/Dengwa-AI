from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from services import review_service
from services.user_service import get_current_user

from schemas import ReviewCardOut

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewRequest(BaseModel):
    ease: int = Field(ge=1, le=4)


@router.get("/next", response_model=ReviewCardOut | None)
def get_next_review(
        learning_id: UUID | None = None,
        media_id: UUID | None = None,
        template: str | None = None,
        db: Session = Depends(get_db),
        user=Depends(get_current_user),
):
    """Return the next due card, optionally scoped to a language and/or a medium."""
    return review_service.get_next_card(db, user.id, learning_id, media_id, template)


@router.post("/{card_id}", response_model=ReviewCardOut)
def submit_review(
        card_id: UUID,
        payload: ReviewRequest,
        db: Session = Depends(get_db),
        user=Depends(get_current_user),
):
    """Submit a review grade (1-4) for a card and get back its updated schedule."""
    return review_service.review_card(db, card_id, user.id, payload.ease)


@router.get("/count")
def get_review_count(
        learning_id: UUID | None = None,
        media_id: UUID | None = None,
        template: str | None = None,
        db: Session = Depends(get_db),
        user=Depends(get_current_user),
):
    """Return due-card counts per queue, optionally scoped to a language and/or a medium."""
    return review_service.get_queue_counts(db, user.id, learning_id, media_id, template)
