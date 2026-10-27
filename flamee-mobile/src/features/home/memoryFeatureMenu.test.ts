import assert from "node:assert/strict";
import test from "node:test";
import { getMemoryFeatureMenu } from "./memoryFeatureMenu.ts";

test("a memories route selects the calendar and supplies the same title to its header and quick menu", () => {
  const menu = getMemoryFeatureMenu("memories");
  assert.equal(menu.active.id, "memories");
  assert.equal(menu.active.titleKey, "timelineMemories");
  assert.deepEqual(menu.items.filter((item) => item.selected).map((item) => item.id), ["memories"]);
  assert.equal(menu.items.find((item) => item.selected)?.titleKey, menu.active.titleKey);
});

test("changing the route back to timeline clears the previous quick-menu selection", () => {
  const menu = getMemoryFeatureMenu("timeline");
  assert.equal(menu.active.titleKey, "timelineFeed");
  assert.deepEqual(menu.items.map((item) => [item.id, item.selected]), [["timeline", true], ["memories", false]]);
});

test("missing or invalid route parameters fall back to a real feature with one active item", () => {
  for (const input of [undefined, "unknown", "", ["memories"], []]) {
    const menu = getMemoryFeatureMenu(input);
    assert.equal(menu.active.id, Array.isArray(input) && input[0] === "memories" ? "memories" : "timeline");
    assert.equal(menu.items.filter((item) => item.selected).length, 1);
  }
});
