# Calculate the sum of two numbers
def calculate(a, b):
    """
    Core calculator function with strict numeric type validation.
    """
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise ValueError("Inputs must be numeric")
    return a + b

# Perform safe division with strict numeric validation and zero division checks
def divide(a, b):
    """
    Performs safe division with strict numeric validation and zero division checks.
    """
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise ValueError("Inputs must be numeric")
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b


def apply_discount(price, discount_percent):
    """
    Calculates the discounted price with validation for price and percentage range.
    """
    if not isinstance(price, (int, float)) or not isinstance(discount_percent, (int, float)):
        raise ValueError("Inputs must be numeric")
    if price < 0:
        raise ValueError("Price cannot be negative")
    if discount_percent < 0 or discount_percent > 100:
        raise ValueError("Discount must be between 0 and 100")
    discounted = price * (1 - discount_percent / 100)
    return round(discounted, 2)
