from database import get_db
from fastapi import Depends
from sqlalchemy.orm import Session


def get_current_user():
    """Returns the current authenticated user. TODO: replace with real JWT auth."""
    return {"id": 1}
