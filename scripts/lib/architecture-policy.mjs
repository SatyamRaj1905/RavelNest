import path from 'node:path';
import { isBuiltin } from 'node:module';

const serverEntrypoints = new Set([
  'next/headers',
  'next/cache',
  'next/server',
]);

const allowedLayers = {
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

export function layerOf(sourceRoot, filename) {
  return path.relative(sourceRoot, filename).split(path.sep)[0];
}

export function isAllowedLayer(from, to) {
  return allowedLayers[from]?.has(to) ?? false;
}

export function isAllowedDomainExternal(specifier) {
  // Contract validation is the domain's only approved external dependency.
  return specifier === 'zod' || specifier.startsWith('zod/');
}

export function isInternalImport(specifier) {
  return (
    specifier.startsWith('.') ||
    specifier.startsWith('@/') ||
    path.isAbsolute(specifier)
  );
}

export function resolveInternalImport(
  sourceRoot,
  filename,
  specifier,
  knownFiles,
) {
  const base = specifier.startsWith('@/')
    ? path.resolve(sourceRoot, specifier.slice(2))
    : path.resolve(path.dirname(filename), specifier);
  const extensionless = base.replace(/\.[cm]?js$/u, '');
  const candidates = [
    base,
    `${extensionless}.ts`,
    `${extensionless}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  return candidates.find((candidate) => knownFiles.has(candidate));
}

export function isServerModule(sourceRoot, filename, imports) {
  return (
    layerOf(sourceRoot, filename) === 'infrastructure' ||
    /\.server\.[cm]?[jt]sx?$/u.test(filename) ||
    imports.serverOnly ||
    imports.imports.some(
      ({ specifier, typeOnly }) =>
        !typeOnly && (isBuiltin(specifier) || serverEntrypoints.has(specifier)),
    )
  );
}
