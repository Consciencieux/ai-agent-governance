import json


def export_json(records: list[dict]) -> str:
    return json.dumps(records, ensure_ascii=False)
