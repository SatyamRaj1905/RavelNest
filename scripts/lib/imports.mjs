import ts from 'typescript';

function location(sourceFile, node) {
  const position = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  return { line: position.line + 1, column: position.character + 1 };
}

function typeOnlyImport(node) {
  const clause = node.importClause;
  if (!clause) return false;
  if (clause.isTypeOnly) return true;
  const bindings = clause.namedBindings;
  return Boolean(
    !clause.name &&
    bindings &&
    ts.isNamedImports(bindings) &&
    bindings.elements.length > 0 &&
    bindings.elements.every((element) => element.isTypeOnly),
  );
}

function typeOnlyExport(node) {
  if (node.isTypeOnly) return true;
  const clause = node.exportClause;
  return Boolean(
    clause &&
    ts.isNamedExports(clause) &&
    clause.elements.length > 0 &&
    clause.elements.every((element) => element.isTypeOnly),
  );
}

function moduleReference(node) {
  if (ts.isImportDeclaration(node)) {
    return {
      argument: node.moduleSpecifier,
      kind: 'import',
      typeOnly: typeOnlyImport(node),
    };
  }
  if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
    return {
      argument: node.moduleSpecifier,
      kind: 'export',
      typeOnly: typeOnlyExport(node),
    };
  }
  if (ts.isImportTypeNode(node)) {
    return {
      argument: node.argument.literal,
      kind: 'import-type',
      typeOnly: true,
    };
  }
  if (
    ts.isImportEqualsDeclaration(node) &&
    ts.isExternalModuleReference(node.moduleReference)
  ) {
    return {
      argument: node.moduleReference.expression,
      kind: 'import-equals',
      typeOnly: node.isTypeOnly,
    };
  }
  if (!ts.isCallExpression(node)) return undefined;
  if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
    return {
      argument: node.arguments[0],
      kind: 'dynamic-import',
      typeOnly: false,
    };
  }
  if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
    return { argument: node.arguments[0], kind: 'require', typeOnly: false };
  }
  return undefined;
}

function directives(sourceFile) {
  const result = new Set();
  for (const statement of sourceFile.statements) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isStringLiteral(statement.expression)
    )
      break;
    result.add(statement.expression.text);
  }
  return result;
}

export function readImports(filename, content) {
  const sourceFile = ts.createSourceFile(
    filename,
    content,
    ts.ScriptTarget.Latest,
    true,
  );
  const imports = [];
  const errors = sourceFile.parseDiagnostics.map((diagnostic) => ({
    code: 'syntax',
    ...location(sourceFile, { getStart: () => diagnostic.start ?? 0 }),
    detail: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
  }));
  function visit(node) {
    const reference = moduleReference(node);
    if (reference) {
      const { argument, ...properties } = reference;
      if (
        argument &&
        (ts.isStringLiteral(argument) ||
          ts.isNoSubstitutionTemplateLiteral(argument))
      ) {
        imports.push({
          specifier: argument.text,
          ...properties,
          ...location(sourceFile, node),
        });
      } else {
        errors.push({
          code: 'dynamic-import',
          ...location(sourceFile, node),
          detail: `${reference.kind} must use a string literal so its architecture boundary can be checked.`,
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  const markers = directives(sourceFile);
  return {
    imports,
    errors,
    client: markers.has('use client'),
    serverOnly:
      markers.has('use server') ||
      imports.some(
        (entry) => entry.specifier === 'server-only' && !entry.typeOnly,
      ),
  };
}
