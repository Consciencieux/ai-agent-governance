def is_active(expires_at: int, now: int) -> bool:
    return now <= expires_at
