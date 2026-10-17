import assert from "node:assert/strict";
import test from "node:test";

test("locks edge overscroll without disabling hero-screen scrolling", async () => {
  const behaviorModule = await import("./heroScrollBehavior.ts").catch(() => null);

  assert.ok(behaviorModule, "hero scroll behavior is not implemented");
  assert.deepEqual(behaviorModule.lockedHeroScrollProps, {
    alwaysBounceVertical: false,
    bounces: false,
    overScrollMode: "never",
    scrollEnabled: true,
  });
});
