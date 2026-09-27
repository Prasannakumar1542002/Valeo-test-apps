from decimal import Decimal, ROUND_HALF_UP

def calculate(a, b):
    """
    Core calculator function with strict numeric type validation.
    """
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise ValueError("Inputs must be numeric")
    # Rounding added to address floating-point precision issues in tests.
    return round(a + b, 2)


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
    The final discounted price is rounded to 2 decimal places using ROUND_HALF_UP.
    """
    if not isinstance(price, (int, float)) or not isinstance(discount_percent, (int, float)):
        raise ValueError("Inputs must be numeric")
    if price < 0:
        raise ValueError("Price cannot be negative")
    if discount_percent < 0 or discount_percent > 100:
        raise ValueError("Discount must be between 0 and 100")
    
    # Convert inputs to Decimal for precise arithmetic, avoiding floating-point issues.
    # Using str() conversion to ensure exact representation of float literals.
    price_d = Decimal(str(price))
    discount_percent_d = Decimal(str(discount_percent))

    # Perform calculation
    discount_factor = Decimal('1') - (discount_percent_d / Decimal('100'))
    discounted_d = price_d * discount_factor

    # Apply standard "round half up" to 2 decimal places.
    rounded_price = discounted_d.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return float(rounded_price)
