import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / 'settings.json').read_text())
(ROOT / 'generated').mkdir(exist_ok=True)
(ROOT / 'generated/help.txt').write_text('Commands: ' + ', '.join(config['commands']) + '\n')
