"""Check the single-record and batch expiry contract in a task result directory."""
import os
from pathlib import Path
import subprocess
import sys

PROGRAM = '''
from app.tokens import is_active
from app.batch import active_records
for expiry in (0, 10, 100):
    assert is_active(expiry, expiry - 1) is True
    assert is_active(expiry, expiry) is False
    assert is_active(expiry, expiry + 1) is False
rows = [{"id": "past", "expires_at": 9}, {"id": "equal", "expires_at": 10},
        {"id": "future", "expires_at": 11}]
assert active_records(rows, 10) == [rows[2]]
assert active_records([], 10) == []
print("Expiry contract passed for both consumers.")
'''


def check(root: Path) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, '-c', PROGRAM], cwd=root,
                          env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'},
                          text=True, capture_output=True, encoding='utf-8')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python check_expiry.py <result-directory>')
    result = check(Path(sys.argv[1]).resolve())
    print(result.stdout, end='')
    print(result.stderr, end='', file=sys.stderr)
    raise SystemExit(result.returncode)
