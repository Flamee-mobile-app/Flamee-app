import assert from "node:assert/strict";
import test from "node:test";
import { getSectionCardPresentation } from "./sectionCardPresentation.ts";

test("action cards are visibly interactive at rest and compress their depth when pressed", () => {
  const resting = getSectionCardPresentation("action", false);
  const pressed = getSectionCardPresentation("action", true);
  const ordinary = getSectionCardPresentation("default", false);
  assert.equal(resting.borderWidth, 1);
  assert.ok(resting.shadowOpacity > ordinary.shadowOpacity);
  assert.ok(resting.elevation > ordinary.elevation);
  assert.ok(pressed.elevation < resting.elevation);
});
