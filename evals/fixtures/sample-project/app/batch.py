def active_records(records: list[dict], now: int) -> list[dict]:
    return [row for row in records if row["expires_at"] >= now]
