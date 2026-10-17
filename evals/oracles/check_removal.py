"""Check known active aliases and retained queue behavior in the deletion fixture."""
import os
from pathlib import Path
import re
import subprocess
import sys

ALIASES = re.compile(r'quick[-_]?replay|快速回放|REPLAY_STAGE', re.I)
HISTORY = 'docs/CHANGELOG.md'
PROGRAM = '''
from app.core import enqueue
from app.registry import COMMANDS
queue = []
assert enqueue(queue, 'item') == 1 and queue == ['item']
assert set(COMMANDS) == {'enqueue'}
assert COMMANDS['enqueue'] is enqueue
print('Retained queue behavior passed.')
'''


def check(root: Path) -> tuple[list[str], subprocess.CompletedProcess]:
    failures = []
    history = root / HISTORY
    if not history.exists() or 'QuickReplay' not in history.read_text(encoding='utf-8'):
        failures.append('Requested existing release history was removed or altered.')
    for p in root.rglob('*'):
        rel = p.relative_to(root)
        if any(part in {'.git', '__pycache__'} for part in rel.parts) or rel.as_posix() == HISTORY:
            continue
        if ALIASES.search(rel.as_posix()):
            failures.append(f'Active file name: {rel}')
        if p.is_file() and p.suffix in {'.py', '.json', '.md', '.txt'}:
            if ALIASES.search(p.read_text(encoding='utf-8')):
                failures.append(f'Active content: {rel}')
    result = subprocess.run([sys.executable, '-c', PROGRAM], cwd=root,
                            env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'},
                            text=True, capture_output=True, encoding='utf-8')
    return failures, result


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python check_removal.py <result-directory>')
    failures, result = check(Path(sys.argv[1]).resolve())
    for item in failures:
        print(item)
    print(result.stdout, end='')
    print(result.stderr, end='', file=sys.stderr)
    raise SystemExit(1 if failures or result.returncode else 0)
