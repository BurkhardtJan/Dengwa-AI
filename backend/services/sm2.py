from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass
class SM2Result:
    interval_days: int
    ease_factor: float
    repetitions: int
    due: datetime
    queue: str


def sm2_review(
    ease: int,  # 1=again, 2=hard, 3=good, 4=easy
    interval_days: int,
    ease_factor: float,
    repetitions: int,
) -> SM2Result:
    """
    Apply the SM-2 scheduling algorithm to a single review.

    ease: user-provided grade for this review, mapped to SM-2's 0-5 quality
          scale internally (1->2, 2->3, 3->4, 4->5 — no "perfect" grade exposed).
    """
    quality = {1: 2, 2: 3, 3: 4, 4: 5}[ease]

    if quality < 3:
        repetitions = 0
        interval_days = 1
        queue = "learning"
    else:
        if repetitions == 0:
            interval_days = 1
        elif repetitions == 1:
            interval_days = 6
        else:
            interval_days = round(interval_days * ease_factor)
        repetitions += 1
        queue = "review"

    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ease_factor = max(1.3, ease_factor)

    due = datetime.now(timezone.utc) + timedelta(days=interval_days)

    return SM2Result(
        interval_days=interval_days,
        ease_factor=round(ease_factor, 2),
        repetitions=repetitions,
        due=due,
        queue=queue,
    )