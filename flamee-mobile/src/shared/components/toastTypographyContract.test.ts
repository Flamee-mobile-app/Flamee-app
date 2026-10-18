import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

test("toast text supplies semantic size tokens supported by Flamee fonts", () => {
  const source = readFileSync(new URL("./AppToast.tsx", import.meta.url), "utf8");
  const file = ts.createSourceFile("AppToast.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const expected = new Map([["Toast.Title", "$bodyM"], ["Toast.Description", "$bodyS"]]);
  const found = new Set<string>();
  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node)) {
      const tag = node.tagName.getText(file);
      if (expected.has(tag)) {
        const size = node.attributes.properties.find((prop) => ts.isJsxAttribute(prop) && prop.name.getText(file) === "size");
        assert.ok(size && ts.isJsxAttribute(size) && size.initializer && ts.isStringLiteral(size.initializer), `${tag} must override the library's numeric font-size default`);
        assert.equal(size.initializer.text, expected.get(tag));
        found.add(tag);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.equal(found.size, expected.size);
});

test("toast card has a concrete width inside Tamagui's shrink-wrapped gesture host", () => {
  const source = readFileSync(new URL("./AppToast.tsx", import.meta.url), "utf8");
  const file = ts.createSourceFile("AppToast.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let checked = false;
  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(file) === "Toast") {
      const width = node.attributes.properties.find((prop) => ts.isJsxAttribute(prop) && prop.name.getText(file) === "width");
      assert.ok(width && ts.isJsxAttribute(width) && width.initializer && ts.isJsxExpression(width.initializer), "Percentage width cannot resolve against the library's margin:auto wrapper");
      assert.equal(width.initializer.expression?.getText(file), "cardWidth");
      checked = true;
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.ok(checked);
});
