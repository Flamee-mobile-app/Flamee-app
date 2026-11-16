import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("intrinsic filter chips preserve label width and keep both label layers on one line", () => {
  const source = readFileSync(new URL("./AppFilterChip.tsx", import.meta.url), "utf8");
  assert.match(source, /flexShrink=\{fill \? 1 : 0\}/);
  assert.equal((source.match(/numberOfLines=\{1\}/g) ?? []).length, 2);
  assert.match(source, /position="absolute" left=\{0\} right=\{0\} textAlign="center"/);
});
