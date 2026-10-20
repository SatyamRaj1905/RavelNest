import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { analyzeArchitecture } from '../../scripts/lib/architecture.mjs';
import { qualityLimits } from '../../scripts/quality-policy.mjs';

const sourceRoot = path.resolve('/virtual/ravelnest/src');
function analyze(entries) {
  const files = new Map(
    Object.entries(entries).map(([name, content]) => [
      path.join(sourceRoot, name),
      content,
    ]),
  );
  return analyzeArchitecture({ sourceRoot, files });
}
function errorsOf(report, code) {
  return report.errors.filter((error) => error.code === code);
}

test('resolves relative, alias, index, JavaScript-spelled TypeScript and CSS imports', () => {
  const report = analyze({
    'app/page.tsx':
      "import '@/components/widget'; import '@/styles/globals.css';",
    'components/widget.tsx':
      "import { run } from '@/domain/runner.js'; import type { Shape } from '../domain/types';",
    'domain/runner.ts': 'export const run = () => true;',
    'domain/types/index.ts': 'export type Shape = {};',
    'styles/globals.css': 'body { margin: 0; }',
  });
  assert.deepEqual(report.errors, []);
  assert.equal(report.source.count, 4);
  assert.equal(report.styles.count, 1);
  assert.deepEqual(
    report.graph[0].dependencies.map((entry) => entry.target),
    ['components/widget.tsx', 'styles/globals.css'],
  );
});

for (const syntax of [
  "import './missing';",
  "export * from './missing';",
  "const dependency = import('./missing');",
  "const dependency = require('./missing');",
  "type Dependency = import('./missing').Value;",
]) {
  test(`missing internal target fails: ${syntax}`, () => {
    const report = analyze({ 'domain/example.ts': syntax });
    assert.equal(errorsOf(report, 'unresolved').length, 1);
    assert.match(
      report.errors[0].message,
      /domain\/example\.ts:1:.*Unresolved internal import/u,
    );
  });
}

for (const syntax of [
  "import type { Secret } from '../infrastructure/secret.server';",
  "export * from '../infrastructure/secret.server';",
  "const dependency = import('../infrastructure/secret.server');",
  "const dependency = require('../infrastructure/secret.server');",
]) {
  test(`domain layer escape fails: ${syntax}`, () => {
    const report = analyze({
      'domain/example.ts': syntax,
      'infrastructure/secret.server.ts': 'export type Secret = {};',
    });
    assert.equal(errorsOf(report, 'layer').length, 1);
    assert.match(
      report.errors[0].message,
      /domain\/example\.ts → infrastructure\/secret\.server\.ts/u,
    );
  });
}

for (const specifier of [
  'next/server',
  'react',
  'server-only',
  'node:fs',
  '@provider/sdk',
]) {
  test(`pure domain rejects external dependency ${specifier}`, () => {
    const report = analyze({ 'domain/example.ts': `import '${specifier}';` });
    assert.equal(errorsOf(report, 'domain-external').length, 1);
    assert.match(
      report.errors[0].message,
      /only zod contract validation is approved/u,
    );
  });
}

test('domain contracts may use the explicitly approved pure schema dependency', () => {
  const report = analyze({
    'domain/contracts.ts':
      "import { z } from 'zod'; import type { $ZodType } from 'zod/v4/core';",
  });
  assert.deepEqual(report.errors, []);
});

test('cycles include the concrete path across type and dynamic imports', () => {
  const report = analyze({
    'domain/a.ts': "import type { Value } from './b';",
    'domain/b.ts': "const other = import('./c');",
    'domain/c.ts': "export * from './a';",
  });
  const cycles = errorsOf(report, 'cycle');
  assert.equal(cycles.length, 1);
  assert.equal(
    cycles[0].message,
    'Dependency cycle: domain/a.ts → domain/b.ts → domain/c.ts → domain/a.ts.',
  );
});

for (const serverFile of [
  ['app/hidden.server.ts', 'export {};'],
  ['app/hidden.ts', "import 'server-only';"],
  ['app/hidden.ts', "'use server'; export {};"],
  ['infrastructure/hidden.ts', 'export {};'],
  ['app/hidden.ts', "import { readFile } from 'node:fs/promises';"],
  ['app/hidden.ts', "import path from 'path';"],
  ['app/hidden.ts', "import { headers } from 'next/headers';"],
  ['app/hidden.ts', "import { revalidatePath } from 'next/cache';"],
  ['app/hidden.ts', "import { NextResponse } from 'next/server';"],
]) {
  test(`client entry cannot transitively reach ${serverFile[0]} (${serverFile[1]})`, () => {
    const report = analyze({
      'app/page.tsx': "'use client'; import './bridge';",
      'app/bridge.ts': `export * from '@/${serverFile[0].replace(/\.ts$/u, '')}';`,
      [serverFile[0]]: serverFile[1],
    });
    const leaks = errorsOf(report, 'client-server');
    assert.equal(leaks.length, 1);
    assert.match(leaks[0].message, /app\/page\.tsx → app\/bridge\.ts →/u);
  });
}

test('erased type-only edges do not create runtime client/server leaks', () => {
  const report = analyze({
    'app/page.tsx':
      "'use client'; import type { Value } from './hidden.server';",
    'app/hidden.server.ts': 'export type Value = string;',
  });
  assert.deepEqual(report.errors, []);
});

test('erased Node and Next server types do not make a shared module server-only', () => {
  const report = analyze({
    'app/page.tsx': "'use client'; import './shared';",
    'app/shared.ts': `
      import type { Stats } from 'node:fs';
      import { type PlatformPath } from 'path';
      export type { NextResponse } from 'next/server';
      type HeadersModule = typeof import('next/headers');
    `,
  });
  assert.deepEqual(report.errors, []);
  assert.equal(
    report.graph.find((entry) => entry.file === 'app/shared.ts').serverOnly,
    false,
  );
});

test('nonliteral dynamic module loading cannot bypass boundary checks', () => {
  const report = analyze({
    'components/loader.tsx': 'const loaded = import(`../${name}`);',
  });
  assert.equal(errorsOf(report, 'dynamic-import').length, 1);
});

test('source and CSS file budgets accept the exact boundary and reject one extra line', () => {
  const atLimit = '\n'.repeat(qualityLimits.fileLines);
  const overLimit = `${atLimit}\n`;
  const report = analyze({
    'domain/exact.ts': atLimit,
    'domain/oversized.ts': overLimit,
    'styles/exact.css': atLimit,
    'styles/oversized.css': overLimit,
  });
  assert.equal(report.source.maxLines, qualityLimits.fileLines + 1);
  assert.equal(report.styles.maxLines, qualityLimits.fileLines + 1);
  assert.deepEqual(
    errorsOf(report, 'file-lines').map((error) => error.file),
    ['domain/oversized.ts', 'styles/oversized.css'],
  );
  assert.equal(report.limits.fileLines, qualityLimits.fileLines);
});
