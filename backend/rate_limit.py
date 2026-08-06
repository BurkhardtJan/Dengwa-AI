import os
from slowapi import Limiter
from slowapi.util import get_remote_address

# DISABLE_RATE_LIMIT=true turns this off for CI/automated test runs
limiter = Limiter(
    key_func=get_remote_address,
    enabled=os.environ.get("DISABLE_RATE_LIMIT", "false").lower() != "true",
)