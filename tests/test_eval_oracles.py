import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'evals/oracles'))
import check_expiry
import check_csv
import check_removal


class OracleTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def fixture(self, name='sample-project'):
        dest = self.root / name
        shutil.copytree(ROOT / 'evals/fixtures' / name, dest,
                        ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
        return dest

    def patch_expiry(self, root, batch=True):
        p = root / 'app/tokens.py'
        p.write_text(p.read_text().replace('now <= expires_at', 'now < expires_at'))
        if batch:
            p = root / 'app/batch.py'
            p.write_text(p.read_text().replace('>= now', '> now'))

    def remove_feature(self, root):
        (root / 'app/quick_replay.py').unlink()
        (root / 'tests/test_replay.py').unlink()
        (root / 'app/registry.py').write_text('from .core import enqueue\nCOMMANDS = {"enqueue": enqueue}\n')
        settings = json.loads((root / 'settings.json').read_text())
        del settings['REPLAY_STAGE']
        del settings['quick_replay']
        settings['commands'] = ['enqueue']
        (root / 'settings.json').write_text(json.dumps(settings))
        (root / 'README.md').write_text('# Queue\nAppend items using app.core.enqueue.\n')
        (root / 'docs/current.md').write_text('# Queue\nUse the enqueue command.\n')
        result = subprocess.run([sys.executable, 'tools/generate_help.py'], cwd=root,
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_original_project_tests_pass(self):
        root = self.fixture()
        result = subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-v'],
                                cwd=root, capture_output=True, text=True,
                                env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('Ran 5 tests', result.stderr)

    def test_expiry_oracle_rejects_original_defect(self):
        self.assertNotEqual(check_expiry.check(self.fixture()).returncode, 0)

    def test_expiry_oracle_rejects_one_sibling_left(self):
        root = self.fixture()
        self.patch_expiry(root, batch=False)
        self.assertNotEqual(check_expiry.check(root).returncode, 0)

    def test_expiry_oracle_accepts_correct_behavior(self):
        root = self.fixture()
        self.patch_expiry(root)
        result = check_expiry.check(root)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_csv_oracle_rejects_missing_feature(self):
        self.assertNotEqual(check_csv.check(self.fixture()).returncode, 0)

    def test_csv_oracle_rejects_naive_join(self):
        root = self.fixture()
        with (root / 'app/export.py').open('a') as f:
            f.write('\ndef export_csv(records):\n    return "id,name\\n" + "\\n".join(str(r["id"])+","+r["name"] for r in records)\n')
        self.assertNotEqual(check_csv.check(root).returncode, 0)

    def test_csv_oracle_accepts_standard_library(self):
        root = self.fixture()
        with (root / 'app/export.py').open('a') as f:
            f.write('''

def export_csv(records):
    import csv
    import io
    output = io.StringIO(newline='')
    writer = csv.DictWriter(output, fieldnames=['id', 'name'])
    writer.writeheader()
    writer.writerows(records)
    return output.getvalue()
''')
        result = check_csv.check(root)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_deletion_oracle_rejects_original(self):
        failures, _ = check_removal.check(self.fixture('cleanup-project'))
        self.assertTrue(failures)

    def test_deletion_oracle_accepts_complete_removal(self):
        root = self.fixture('cleanup-project')
        self.remove_feature(root)
        failures, result = check_removal.check(root)
        self.assertEqual(failures, [])
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_deletion_oracle_detects_negated_residue(self):
        root = self.fixture('cleanup-project')
        self.remove_feature(root)
        (root / 'README.md').write_text('# Queue\nQuickReplay has been removed.\n')
        failures, _ = check_removal.check(root)
        self.assertTrue(any('README.md' in f for f in failures))

    def test_deletion_oracle_protects_requested_history(self):
        root = self.fixture('cleanup-project')
        self.remove_feature(root)
        (root / 'docs/CHANGELOG.md').unlink()
        failures, _ = check_removal.check(root)
        self.assertTrue(any('history' in f for f in failures))

    def test_deletion_oracle_detects_broken_retained_behavior(self):
        root = self.fixture('cleanup-project')
        self.remove_feature(root)
        (root / 'app/core.py').write_text('def enqueue(queue, item):\n    return 0\n')
        failures, result = check_removal.check(root)
        self.assertEqual(failures, [])
        self.assertNotEqual(result.returncode, 0)


if __name__ == '__main__':
    unittest.main()
