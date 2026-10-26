import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const iconSource = await readFile('src/icons.ts', 'utf8');
const compiled = ts.transpileModule(iconSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { GAME_ICON_NAMES, gameIcon } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const supported = new Set(GAME_ICON_NAMES), required = new Set();
const literalValues = expression => {
  if (!expression) return;
  if (ts.isStringLiteral(expression)) required.add(expression.text);
  else if (ts.isConditionalExpression(expression)) { literalValues(expression.whenTrue); literalValues(expression.whenFalse); }
  else if (ts.isParenthesizedExpression(expression)) literalValues(expression.expression);
};
for (const file of ['src/main.ts', 'src/presentation.ts', 'src/item-catalog.ts', 'src/game/content.ts']) {
  const text = await readFile(file, 'utf8');
  if (/data-lucide|createIcons|from ['"]lucide/.test(text)) throw new Error(`Legacy icon renderer remains in ${file}`);
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'icon') literalValues(node.arguments[0]);
    if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'icon') literalValues(node.initializer);
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'slotIcons' && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      for (const property of node.initializer.properties) if (ts.isPropertyAssignment(property)) literalValues(property.initializer);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const missing = [...required].filter(name => !supported.has(name));
if (missing.length) throw new Error('Missing game icons: ' + missing.join(', '));
for (const name of supported) if (!gameIcon(name).startsWith('<svg') || gameIcon(name).includes('data-icon-fallback')) throw new Error('Invalid rendered icon: ' + name);
const records = JSON.parse(await readFile('docs/icons-v03.json', 'utf8'));
for (const record of records) {
  const png = await readFile(record.asset);
  if (png.subarray(1, 4).toString() !== 'PNG' || record.cells.length !== 16) throw new Error('Invalid icon sheet: ' + record.asset);
}
console.log(`Icon coverage passed: ${required.size} used semantic names, ${supported.size} registered names, 48 painted cells, no legacy renderer.`);
