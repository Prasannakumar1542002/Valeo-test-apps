import pytest
from app.utils import calculate

def test_calculate_basic():
    assert calculate(2, 3) == 5
    assert calculate(1.5, 2.5) == 4.0
