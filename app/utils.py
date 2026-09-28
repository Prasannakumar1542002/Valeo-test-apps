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