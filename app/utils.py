def calculate(a, b):
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise ValueError("Inputs must be numeric")
    return a + b

def apply_discount(price, discount_percent):
    if not isinstance(price, (int, float)) or not isinstance(discount_percent, (int, float)):
        raise ValueError("Inputs must be numeric")
    if price < 0:
        raise ValueError("Price cannot be negative")
    if not (0 <= discount_percent <= 100):
        raise ValueError("Discount must be between 0 and 100")
    discounted_price = price * (1 - discount_percent / 100)
    return round(float(discounted_price), 2)