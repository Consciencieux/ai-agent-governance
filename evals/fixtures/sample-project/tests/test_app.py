import json
import unittest
from app.tokens import is_active
from app.batch import active_records
from app.export import export_json


class AppTests(unittest.TestCase):
    def test_active_before_expiry(self):
        self.assertTrue(is_active(100, 99))

    def test_inactive_after_expiry(self):
        self.assertFalse(is_active(100, 101))

    def test_batch_before(self):
        rows = [{"id": 1, "expires_at": 100}]
        self.assertEqual(active_records(rows, 99), rows)

    def test_batch_after(self):
        self.assertEqual(active_records([{"expires_at": 100}], 101), [])

    def test_json(self):
        rows = [{"id": 1, "name": "测试"}]
        self.assertEqual(json.loads(export_json(rows)), rows)


if __name__ == '__main__':
    unittest.main()
