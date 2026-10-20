import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { walkFiles } from './lib/files.mjs';

const limits = {
  js: { raw: 850_000, gzip: 260_000 },
  css: { raw: 50_000, gzip: 12_000 },
};
const files = await walkFiles('.next/static');
const measured = {};
for (const [extension, budget] of Object.entries(limits)) {
  const contents = await Promise.all(
    files
      .filter((file) => file.endsWith(`.${extension}`))
      .map((file) => readFile(file)),
  );
  const result = contents.reduce(
    (sum, data) => ({
      raw: sum.raw + data.length,
      gzip: sum.gzip + gzipSync(data).length,
    }),
    { raw: 0, gzip: 0 },
  );
  measured[extension] = { ...result, budget, files: contents.length };
  if (result.raw > budget.raw || result.gzip > budget.gzip)
    throw new Error(
      `${extension} exceeds the total static asset budget: ${JSON.stringify(result)}`,
    );
}
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/bundle.json', JSON.stringify(measured, null, 2));
console.log(JSON.stringify(measured, null, 2));
