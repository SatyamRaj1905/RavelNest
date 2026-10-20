import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  countLines,
  readSourceFiles,
  walkFiles,
} from '../../scripts/lib/files.mjs';

test('file traversal is recursive and deterministic; source input excludes non-source assets', async (context) => {
  const directory = await mkdtemp(
    path.join(tmpdir(), 'ravelnest-architecture-'),
  );
  context.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'nested'));
  await writeFile(path.join(directory, 'z.css'), 'body {}\n');
  await writeFile(path.join(directory, 'nested', 'a.tsx'), 'export {};\n');
  await writeFile(path.join(directory, 'asset.svg'), '<svg />\n');
  const all = await walkFiles(directory);
  assert.deepEqual(all, [...all].sort());
  assert.equal(all.length, 3);
  const sources = await readSourceFiles(directory);
  assert.deepEqual(
    [...sources.keys()].map((filename) => path.relative(directory, filename)),
    ['nested/a.tsx', 'z.css'],
  );
});

test('line measurements count physical blank lines without a phantom final line', () => {
  assert.equal(countLines(''), 0);
  assert.equal(countLines('one'), 1);
  assert.equal(countLines('one\n'), 1);
  assert.equal(countLines('one\n\n'), 2);
  assert.equal(countLines('one\r\ntwo\r\n'), 2);
  assert.equal(countLines('one\rtwo\r'), 2);
});
