"""Check CSV round-tripping and retained JSON behavior in a task result directory."""
import os
from pathlib import Path
import subprocess
import sys

PROGRAM = r'''
import csv
import io
import json
from app.export import export_csv, export_json
rows = [{"id": 1, "name": '逗号,和"引号"'}, {"id": 2, "name": "第一行\n第二行"}]
text = export_csv(rows)
assert isinstance(text, str)
assert list(csv.reader(io.StringIO(text))) == [
    ['id', 'name'], ['1', rows[0]['name']], ['2', rows[1]['name']]]
assert list(csv.reader(io.StringIO(export_csv([])))) == [['id', 'name']]
assert json.loads(export_json(rows)) == rows
print('CSV contract and retained JSON behavior passed.')
'''


def check(root: Path) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, '-c', PROGRAM], cwd=root,
                          env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'},
                          text=True, capture_output=True, encoding='utf-8')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python check_csv.py <result-directory>')
    result = check(Path(sys.argv[1]).resolve())
    print(result.stdout, end='')
    print(result.stderr, end='', file=sys.stderr)
    raise SystemExit(result.returncode)
