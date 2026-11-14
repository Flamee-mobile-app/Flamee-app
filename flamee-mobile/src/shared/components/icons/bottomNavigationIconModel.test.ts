import assert from "node:assert/strict";
import test from "node:test";
import * as model from "./bottomNavigationIcons.ts";

test("every active glyph supplies a cream fill directly on its visible shapes", () => {
  assert.equal(typeof model.getBottomNavigationIconXml, "function");
  for (const name of ["home", "activity", "tasks", "profile"] as const) {
    const xml = model.getBottomNavigationIconXml(name, true);
    const shapes = [...xml.matchAll(/<(?:path|circle|ellipse|rect|polygon|polyline)\b([^>]*)/g)];
    assert.ok(shapes.length > 0, `${name} must retain its visible geometry`);
    for (const [, attributes] of shapes) {
      assert.match(attributes, /\bfill="#FFFCF8"/, `${name} must not depend on a parent's inherited fill`);
    }
    assert.ok(!xml.includes("currentColor"));
  }
});

test("inactive glyphs retain transparent interiors and explicit white strokes", () => {
  assert.equal(typeof model.getBottomNavigationIconXml, "function");
  for (const name of ["home", "activity", "tasks", "profile"] as const) {
    const xml = model.getBottomNavigationIconXml(name, false);
    const shapes = [...xml.matchAll(/<(?:path|circle|ellipse|rect|polygon|polyline)\b([^>]*)/g)];
    assert.ok(shapes.length > 0);
    for (const [, attributes] of shapes) {
      assert.match(attributes, /\bfill="none"/);
      assert.match(attributes, /\bstroke="#FFFFFF"/);
    }
    assert.ok(!xml.includes("currentColor"));
  }
});
