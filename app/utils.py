import unittest
from app.utils import calculate, divide

class TestUtils(unittest.TestCase):
    def test_calculate(self):
        # Test with valid inputs
        self.assertEqual(calculate(10, 5), 15)
        self.assertEqual(calculate(7, 2), 9)
        
        # Test with invalid inputs
        self.assertRaises(ValueError, calculate, 10, 'a')
        self.assertRaises(ValueError, calculate, 'b', 0)
        self.assertRaises(ZeroDivisionError, divide, 10, 0)

    def test_divide(self):
        # Test with valid inputs
        self.assertEqual(divide(10, 5), 2)
        self.assertEqual(divide(7, 2), 3.5)
        
        # Test with invalid inputs
        self.assertRaises(ValueError, divide, 10, 'a')
        self.assertRaises(ValueError, divide, 'b', 0)
        self.assertRaises(ZeroDivisionError, divide, 10, 0)

if __name__ == '__main__':
    unittest.main()