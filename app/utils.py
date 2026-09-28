from decimal import Decimal, ROUND_HALF_UP

def calculate(a, b):
    """
    Core calculator function with strict numeric type validation.
    """
    if isinstance(a, bool) or isinstance(b, bool) or not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise ValueError("Inputs must be numeric")
    return round(a + b, 2)


def divide(a, b):
    """
    Performs safe division with strict numeric validation and zero division checks.
    """
    if isinstance(a, bool) or isinstance(b, bool) or not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise ValueError("Inputs must be numeric")
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b


def apply_discount(price, discount_percent):
    """
    Calculates the discounted price with validation for price and percentage range.
    The final discounted price is rounded to 2 decimal places.
    """
    if isinstance(price, bool) or isinstance(discount_percent, bool) or not isinstance(price, (int, float)) or not isinstance(discount_percent, (int, float)):
        raise ValueError("Inputs must be numeric")
    if price < 0:
        raise ValueError("Price cannot be negative")
    if discount_percent < 0 or discount_percent > 100:
        raise ValueError("Discount must be between 0 and 100")
    
    discounted_price = price * (1 - discount_percent / 100)
    return round(float(discounted_price), 2)