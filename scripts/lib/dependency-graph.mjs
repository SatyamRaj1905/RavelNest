export function dependencyCycles(graph) {
  const visited = new Set();
  const active = new Set();
  const trail = [];
  const cycles = [];
  function visit(filename) {
    if (active.has(filename)) {
      cycles.push([...trail.slice(trail.indexOf(filename)), filename]);
      return;
    }
    if (visited.has(filename)) return;
    active.add(filename);
    trail.push(filename);
    for (const dependency of graph.get(filename) ?? [])
      visit(dependency.target);
    trail.pop();
    active.delete(filename);
    visited.add(filename);
  }
  for (const filename of graph.keys()) visit(filename);
  return cycles;
}

export function clientServerPath(entry, modules, graph) {
  const queue = [[entry]];
  const visited = new Set();
  for (let index = 0; index < queue.length; index++) {
    const trail = queue[index];
    const filename = trail.at(-1);
    if (visited.has(filename)) continue;
    visited.add(filename);
    if (modules.get(filename)?.serverOnly) return trail;
    for (const dependency of graph.get(filename) ?? []) {
      if (!dependency.typeOnly) queue.push([...trail, dependency.target]);
    }
  }
  return undefined;
}
