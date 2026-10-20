import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { analyzeArchitecture } from './lib/architecture.mjs';
import { readSourceFiles } from './lib/files.mjs';

const sourceRoot = path.resolve('src');
const files = await readSourceFiles(sourceRoot);
const report = analyzeArchitecture({ sourceRoot, files });

await mkdir('artifacts', { recursive: true });
await writeFile(
  'artifacts/quality.json',
  JSON.stringify(report, null, 2) + '\n',
);

if (report.errors.length > 0) {
  console.error(report.errors.map((error) => error.message).join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Architecture passed: ${report.source.count} TypeScript files, ${report.styles.count} CSS files; ` +
      `largest source ${report.source.maxLines} lines, largest CSS ${report.styles.maxLines} lines ` +
      `(limit ${report.limits.fileLines}).`,
  );
  console.log(
    'AST dependency graph and file measurements: artifacts/quality.json',
  );
}
