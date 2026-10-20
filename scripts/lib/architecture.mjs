import path from 'node:path';
import { qualityLimits } from '../quality-policy.mjs';
import { countLines } from './files.mjs';
import { readImports } from './imports.mjs';
import { dependencyCycles, clientServerPath } from './dependency-graph.mjs';
import {
  isAllowedDomainExternal,
  isAllowedLayer,
  isInternalImport,
  isServerModule,
  layerOf,
  resolveInternalImport,
} from './architecture-policy.mjs';

function measurements(files, sourceRoot, extension) {
  const measured = [...files]
    .filter(([filename]) => extension.test(filename))
    .map(([filename, content]) => ({
      file: path.relative(sourceRoot, filename),
      lines: countLines(content),
    }));
  return {
    count: measured.length,
    maxLines: Math.max(0, ...measured.map((file) => file.lines)),
    files: measured,
  };
}

function errorAt(errors, code, filename, entry, detail, relative) {
  errors.push({
    code,
    file: relative(filename),
    line: entry.line,
    column: entry.column,
    message: `${relative(filename)}:${entry.line}:${entry.column}: ${detail}`,
  });
}

function addDependencies(context, filename, module) {
  const { sourceRoot, knownFiles, graph, errors, relative } = context;
  const dependencies = [];
  for (const entry of module.imports) {
    if (!isInternalImport(entry.specifier)) {
      if (
        layerOf(sourceRoot, filename) === 'domain' &&
        !isAllowedDomainExternal(entry.specifier)
      ) {
        errorAt(
          errors,
          'domain-external',
          filename,
          entry,
          `Pure domain cannot import "${entry.specifier}"; only zod contract validation is approved.`,
          relative,
        );
      }
      continue;
    }
    const target = resolveInternalImport(
      sourceRoot,
      filename,
      entry.specifier,
      knownFiles,
    );
    if (!target) {
      errorAt(
        errors,
        'unresolved',
        filename,
        entry,
        `Unresolved internal import "${entry.specifier}". Check its spelling and target file.`,
        relative,
      );
      continue;
    }
    if (
      !isAllowedLayer(
        layerOf(sourceRoot, filename),
        layerOf(sourceRoot, target),
      )
    ) {
      errorAt(
        errors,
        'layer',
        filename,
        entry,
        `Forbidden dependency: ${relative(filename)} → ${relative(target)}.`,
        relative,
      );
    }
    dependencies.push({ ...entry, target });
  }
  graph.set(filename, dependencies);
}

function graphErrors(modules, graph, relative) {
  const errors = dependencyCycles(graph).map((cycle) => ({
    code: 'cycle',
    message: `Dependency cycle: ${cycle.map(relative).join(' → ')}.`,
  }));
  for (const [filename, module] of modules) {
    if (!module.client) continue;
    const leak = clientServerPath(filename, modules, graph);
    if (leak)
      errors.push({
        code: 'client-server',
        message: `Client entry reaches server-only code: ${leak.map(relative).join(' → ')}.`,
      });
  }
  return errors;
}

function graphReport(modules, graph, relative) {
  return [...modules].map(([filename, module]) => ({
    file: relative(filename),
    client: module.client,
    serverOnly: module.serverOnly,
    dependencies: (graph.get(filename) ?? []).map(({ target, ...entry }) => ({
      ...entry,
      target: relative(target),
    })),
    externals: module.imports.filter(
      (entry) => !isInternalImport(entry.specifier),
    ),
  }));
}

export function analyzeArchitecture({
  sourceRoot,
  files,
  limits = qualityLimits,
}) {
  const relative = (filename) => path.relative(sourceRoot, filename);
  const context = {
    sourceRoot,
    knownFiles: new Set(files.keys()),
    graph: new Map(),
    errors: [],
    relative,
  };
  const modules = new Map();
  for (const [filename, content] of files) {
    if (!/\.tsx?$/u.test(filename)) continue;
    const imports = readImports(filename, content);
    const module = {
      ...imports,
      serverOnly: isServerModule(sourceRoot, filename, imports),
    };
    modules.set(filename, module);
    for (const entry of imports.errors)
      errorAt(
        context.errors,
        entry.code,
        filename,
        entry,
        entry.detail,
        relative,
      );
    addDependencies(context, filename, module);
  }
  const source = measurements(files, sourceRoot, /\.tsx?$/u);
  const styles = measurements(files, sourceRoot, /\.css$/u);
  const budgetErrors = [...source.files, ...styles.files]
    .filter((file) => file.lines > limits.fileLines)
    .map((file) => ({
      code: 'file-lines',
      file: file.file,
      message: `${file.file}: ${file.lines} lines exceeds the ${limits.fileLines}-line source/CSS budget. Split it by responsibility.`,
    }));
  return {
    limits,
    source,
    styles,
    graph: graphReport(modules, context.graph, relative),
    errors: [
      ...context.errors,
      ...graphErrors(modules, context.graph, relative),
      ...budgetErrors,
    ],
  };
}
