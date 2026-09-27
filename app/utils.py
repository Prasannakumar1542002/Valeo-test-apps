def calculate(a, b):
    """
    Core calculator function.
    TODO: Add robust input type validation to ensure arguments a and b are numeric.
    If they are not, raise ValueError("Inputs must be numeric").
    """
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
