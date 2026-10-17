import unittest
from app.core import enqueue


class QueueTests(unittest.TestCase):
    def test_enqueue(self):
        queue = []
        self.assertEqual(enqueue(queue, "item"), 1)
        self.assertEqual(queue, ["item"])
