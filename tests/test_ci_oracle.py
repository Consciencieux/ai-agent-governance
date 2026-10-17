import sys
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'evals/oracles'))
import check_ci as ci

VALID = '''name: Test
on: [push, pull_request]
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-python@v7
        with:
          python-version: '3.13'
      - run: python -m unittest discover -s tests -v
'''


class CIContractTests(unittest.TestCase):
    def check(self, text):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            if text is not None:
                path = root / '.github/workflows/test.yml'
                path.parent.mkdir(parents=True)
                path.write_text(text, encoding='utf-8')
            return ci.check(root)

    def test_missing_workflow(self):
        self.assertTrue(self.check(None))

    def test_project_command_with_read_permissions(self):
        self.assertEqual(self.check(VALID), [])

    def test_wrong_stack(self):
        self.assertTrue(self.check(VALID.replace('python -m unittest discover -s tests -v', 'npm test')))

    def test_missing_pr_trigger(self):
        self.assertTrue(self.check(VALID.replace('[push, pull_request]', '[push]')))

    def test_filters_violate_all_events_request(self):
        text = VALID.replace('on: [push, pull_request]', 'on:\n  push:\n    paths: [app/**]\n  pull_request:')
        self.assertTrue(self.check(text))

    def test_false_condition_skips_required_test(self):
        text = VALID.replace('      - run:', '      - if: false\n        run:')
        self.assertTrue(self.check(text))

    def test_swallowed_test_failure(self):
        text = VALID.replace('      - run:', '      - continue-on-error: true\n        run:')
        self.assertTrue(self.check(text))

    def test_unrequested_artifact_upload(self):
        text = VALID + '      - uses: actions/upload-artifact@v4\n'
        self.assertTrue(self.check(text))

    def test_normal_always_condition(self):
        text = VALID.replace('      - run:', '      - if: ${{ always() }}\n        run:')
        self.assertEqual(self.check(text), [])

    def test_write_permission(self):
        self.assertTrue(self.check(VALID.replace('contents: read', 'contents: write')))

    def test_empty_event_mapping_is_supported(self):
        text = VALID.replace('on: [push, pull_request]', 'on:\n  push:\n  pull_request:')
        self.assertEqual(self.check(text), [])


if __name__ == '__main__':
    unittest.main()
