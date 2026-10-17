import unittest
from app.quick_replay import replay


class ReplayTests(unittest.TestCase):
    def test_replay(self):
        self.assertEqual(replay([1, 2]), [1, 2])
