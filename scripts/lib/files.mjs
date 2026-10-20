import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const filename = path.join(directory, entry.name);
      return entry.isDirectory() ? walkFiles(filename) : [filename];
    }),
  );
  return nested.flat().sort();
}

export async function readSourceFiles(directory) {
  const files = (await walkFiles(directory)).filter((filename) =>
    /\.(?:tsx?|css)$/u.test(filename),
  );
  const entries = await Promise.all(
    files.map(async (filename) => [filename, await readFile(filename, 'utf8')]),
  );
  return new Map(entries);
}

export function countLines(content) {
  if (content.length === 0) return 0;
  const lines = content.split(/\r\n|\r|\n/u);
  return lines.length - Number(lines.at(-1) === '');
}
