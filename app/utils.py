def calculate(a, b):
    """
    Core calculator function with strict numeric type validation.
    """
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise ValueError("Inputs must be numeric")
    return a + b

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
    Applies a discount to a given price.

    Args:
        price (int or float): The original price.
        discount_percent (int or float): The discount percentage (0-100).

    Returns:
        float: The final discounted price, rounded to 2 decimal places.

    Raises:
        ValueError:
            - If inputs are not numeric.
            - If price is negative.
            - If discount_percent is not between 0 and 100.
    """
    if not isinstance(price, (int, float)) or not isinstance(discount_percent, (int, float)):
        raise ValueError("Inputs must be numeric")

    if price < 0:
        raise ValueError("Price cannot be negative")

    if not (0 <= discount_percent <= 100):
        raise ValueError("Discount must be between 0 and 100")

    discount_factor = 1 - (discount_percent / 100)
    discounted_price = price * discount_factor
    return round(discounted_price, 2)