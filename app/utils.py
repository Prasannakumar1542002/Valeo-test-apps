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
