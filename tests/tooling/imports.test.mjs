import assert from 'node:assert/strict';
import test from 'node:test';
import { readImports } from '../../scripts/lib/imports.mjs';

test('AST reads static imports, re-exports, types, dynamic imports and require', () => {
  const source = `
    import { value } from './value';
    import type { Shape } from './types';
    import { type Extra } from './types';
    import Default, { type Other } from './mixed';
    import './side-effect';
    export { value } from './value';
    export type { Shape } from './types';
    export { type Extra } from './types';
    export * from './all';
    export type * from './types';
    type Imported = import('./types').Shape;
    const lazy = import('./lazy');
    const template = import(\`./template\`);
    const legacy = require('./legacy');
    import Common = require('./common');
  `;
  const result = readImports('/src/domain/example.ts', source);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    result.imports.map(({ specifier, kind, typeOnly }) => [
      specifier,
      kind,
      typeOnly,
    ]),
    [
      ['./value', 'import', false],
      ['./types', 'import', true],
      ['./types', 'import', true],
      ['./mixed', 'import', false],
      ['./side-effect', 'import', false],
      ['./value', 'export', false],
      ['./types', 'export', true],
      ['./types', 'export', true],
      ['./all', 'export', false],
      ['./types', 'export', true],
      ['./types', 'import-type', true],
      ['./lazy', 'dynamic-import', false],
      ['./template', 'dynamic-import', false],
      ['./legacy', 'require', false],
      ['./common', 'import-equals', false],
    ],
  );
});

test('comments and quoted documentation cannot manufacture dependencies', () => {
  const source = `
    // import bad from '../infrastructure/secret.server';
    /* export * from '@/infrastructure/secret.server'; */
    const sentence = "import bad from './missing'";
    const example = \`require('./also-missing')\`;
    const value = { import: './not-an-import' };
  `;
  const result = readImports('/src/domain/example.ts', source);
  assert.deepEqual(result.imports, []);
  assert.deepEqual(result.errors, []);
});

test('computed import and require calls fail closed with source locations', () => {
  const result = readImports(
    '/src/components/example.ts',
    "import(`./${name}`);\nrequire('./' + name);\nimport(moduleName);",
  );
  assert.deepEqual(result.imports, []);
  assert.equal(result.errors.length, 3);
  assert.deepEqual(
    result.errors.map((error) => error.line),
    [1, 2, 3],
  );
  assert.ok(result.errors.every((error) => error.code === 'dynamic-import'));
  assert.match(result.errors[0].detail, /must use a string literal/u);
});

test('only actual directive prologues mark client and server modules', () => {
  assert.equal(
    readImports(
      '/src/components/a.ts',
      "/* leading comment */\n'use client';\nexport {};",
    ).client,
    true,
  );
  assert.equal(
    readImports('/src/components/b.ts', "export {};\n'use client';").client,
    false,
  );
  assert.equal(
    readImports('/src/components/c.ts', "'use server';\nexport {};").serverOnly,
    true,
  );
  assert.equal(
    readImports('/src/components/d.ts', "import 'server-only';").serverOnly,
    true,
  );
});

test('malformed TypeScript reports syntax errors instead of passing silently', () => {
  const result = readImports(
    '/src/domain/broken.ts',
    'export function broken( {',
  );
  assert.ok(result.errors.some((error) => error.code === 'syntax'));
  assert.ok(
    result.errors.every((error) => error.line >= 1 && error.column >= 1),
  );
});
