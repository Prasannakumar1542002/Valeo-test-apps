class CircularDependencyError(Exception): pass

class DependencyResolver:
    def __init__(self):
        self.graph = {}

    def add_dependency(self, task, depends_on):
        if not isinstance(task, str) or not isinstance(depends_on, str) or not task or not depends_on:
            raise ValueError("Task names must be non-empty strings")
        if task == depends_on:
            raise ValueError("Task cannot depend on itself")
        if task not in self.graph:
            self.graph[task] = set()
        if depends_on not in self.graph:
            self.graph[depends_on] = set()
        self.graph[task].add(depends_on)

    def resolve_execution_order(self):
        remaining = {node: set(deps) for node, deps in self.graph.items()}
        result = []
        while remaining:
            batch = sorted([node for node, deps in remaining.items() if not deps])
            if not batch:
                raise CircularDependencyError("Circular dependency detected")
            result.append(batch)
            for node in batch:
                del remaining[node]
            for deps in remaining.values():
                for node in batch:
                    deps.discard(node)
        return result

def calculate_power(base, exponent):
    """Calculates the power of a number: base^exponent"""
    return float(base ** exponent)

def calculate_compound_interest(principal, rate, time, n=1):
    """Calculates compound interest: A = P(1 + r/n)^(nt)"""
    if principal < 0 or rate < 0 or time < 0 or n <= 0:
        raise ValueError("All inputs must be non-negative, and n must be positive.")
    amount = principal * (1 + (rate / n)) ** (n * time)
    return round(amount, 2)

def calculate_water_hardness(calcium_mg_l, magnesium_mg_l):
    """Calculates water hardness in mg/L as CaCO3 using the formula: 2.497 * [Ca] + 4.118 * [Mg]"""
    if calcium_mg_l < 0 or magnesium_mg_l < 0:
        raise ValueError("Concentrations must be non-negative.")
    hardness = (2.497 * calcium_mg_l) + (4.118 * magnesium_mg_l)
    return round(hardness, 2)