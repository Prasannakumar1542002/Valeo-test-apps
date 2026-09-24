def calculate(a, b):
    """
    Core calculator function with strict numeric type validation.
    """
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise ValueError("Inputs must be numeric")
    return a + b
