import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('src');
const allowed = {
  domain: new Set(['domain']),
  infrastructure: new Set(['domain', 'infrastructure']),
  client: new Set(['domain', 'client']),
  application: new Set(['domain', 'infrastructure', 'application']),
  components: new Set(['domain', 'client', 'components']),
  app: new Set([
    'app',
    'components',
    'application',
    'infrastructure',
    'domain',
    'styles',
  ]),
};

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const filename = path.join(directory, entry.name);
      return entry.isDirectory()
        ? sourceFiles(filename)
        : Promise.resolve(/\.tsx?$/.test(filename) ? [filename] : []);
    }),
  );
  return nested.flat();
}

const files = await sourceFiles(root);
const knownFiles = new Set(files);
const layer = (filename) => path.relative(root, filename).split(path.sep)[0];
const graph = new Map();
for (const filename of files) {
  const content = await readFile(filename, 'utf8');
  const imports = [
    ...content.matchAll(
      /\b(?:import|export)\s+(?:type\s+)?(?:[^;'"`]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    ),
  ];
  const dependencies = [];
  for (const match of imports) {
    const specifier = match[1];
    if (!specifier.startsWith('.') && !specifier.startsWith('@/')) continue;
    const base = specifier.startsWith('@/')
      ? path.join(root, specifier.slice(2))
      : path.resolve(path.dirname(filename), specifier);
    const target = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      path.join(base, 'index.ts'),
      path.join(base, 'index.tsx'),
    ].find((candidate) => knownFiles.has(candidate));
    if (!target) continue;
    if (!allowed[layer(filename)]?.has(layer(target)))
      throw new Error(
        `Forbidden dependency: ${path.relative(root, filename)} → ${path.relative(root, target)}`,
      );
    dependencies.push(target);
  }
  graph.set(filename, dependencies);
}

const visited = new Set();
const active = new Set();
function visit(filename, trail = []) {
  if (active.has(filename))
    throw new Error(
      `Dependency cycle: ${[...trail, filename].map((item) => path.relative(root, item)).join(' → ')}`,
    );
  if (visited.has(filename)) return;
  active.add(filename);
  for (const dependency of graph.get(filename) ?? [])
    visit(dependency, [...trail, filename]);
  active.delete(filename);
  visited.add(filename);
}
for (const filename of files) visit(filename);
console.log(
  `Architecture boundaries and static import cycles: ${files.length} source files passed.`,
);
