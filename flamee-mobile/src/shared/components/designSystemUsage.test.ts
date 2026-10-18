import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import ts from "typescript";

const root = join(process.cwd(), "src", "features");
function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sources(path) : entry.name.endsWith(".tsx") ? [path] : [];
  });
}

test("routes and feature pages do not replace content with a loading card", () => {
  const violations: string[] = [];
  for (const path of [...sources(root), ...sources(join(process.cwd(), "app"))]) {
    const file = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node: ts.Node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(file);
        if (node.attributes.properties.some((prop) =>
          ts.isJsxAttribute(prop) && Boolean(prop.initializer) && (
            tag === "AsyncStateView" && prop.name.getText(file) === "variant" && /["']loading["']/.test(prop.initializer!.getText(file))
            || tag === "FoundationScreen" && prop.name.getText(file) === "title" && /["']loadingTitle["']/.test(prop.initializer!.getText(file))
          )
        )) violations.push(relative(process.cwd(), path));
      }
      ts.forEachChild(node, visit);
    }
    visit(file);
  }
  assert.deepEqual(violations, [], "Allow first-load skeletons; keep the screen shell and confirmed data visible instead of a loading card.");
});

test("feature UI imports the approved controls instead of styling raw primitives", () => {
  const violations: string[] = [];
  for (const path of sources(root)) {
    const file = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const node of file.statements) {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
      const module = node.moduleSpecifier.text;
      const forbidden = module === "tamagui" ? new Set(["Button", "Input", "TextArea", "Switch", "Checkbox", "Card", "Sheet", "Dialog"])
        : module === "react-native" ? new Set(["TextInput", "TouchableOpacity", "TouchableHighlight", "Modal", "Pressable"]) : new Set();
      const bindings = node.importClause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings)) continue;
      for (const binding of bindings.elements) {
        const name = (binding.propertyName ?? binding.name).text;
        if (!binding.isTypeOnly && forbidden.has(name)) violations.push(`${relative(root, path)}: ${name}`);
      }
    }
  }
  assert.deepEqual(violations, [], "Use shared design-system components; put native/specialized adapters in shared.");
});

test("feature UI leaves press and focus styles to the shared design system", () => {
  const violations: string[] = [];
  for (const path of sources(root)) {
    const file = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node: ts.Node) {
      if (ts.isJsxAttribute(node) && ["pressStyle", "hoverStyle", "focusStyle", "focusVisibleStyle"].includes(node.name.getText(file))) {
        violations.push(`${relative(root, path)}: ${node.name.getText(file)}`);
      }
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ["YStack", "XStack", "Text", "Image"].includes(node.tagName.getText(file))) {
        if (node.attributes.properties.some((prop) => ts.isJsxAttribute(prop) && prop.name.getText(file) === "onPress")) {
          violations.push(`${relative(root, path)}: interactive ${node.tagName.getText(file)}`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(file);
  }
  assert.deepEqual(violations, [], "Use shared buttons, cards and choices instead of ad hoc stack interactions.");
});
