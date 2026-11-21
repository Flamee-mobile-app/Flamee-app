import assert from "node:assert/strict";
import test from "node:test";
import { resolveSurfaceShadow } from "./surfaceShadow.ts";

const shadow = { shadowColor: "$textPrimary", shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, shadowOpacity: 0.08, elevation: 3 };

test("Android draws an outset shadow with explicit alpha and no legacy elevation", () => {
  assert.deepEqual(resolveSurfaceShadow("android", shadow), { boxShadow: "0px 3px 12px rgba(48,41,36,0.08)" });
  assert.deepEqual(resolveSurfaceShadow("android", { ...shadow, shadowOpacity: 0 }), { boxShadow: "none" });
});

test("iOS and web retain the legacy shadow while elevation remains Android-only", () => {
  const { elevation, ...legacy } = shadow;
  assert.deepEqual(resolveSurfaceShadow("ios", shadow), legacy);
  assert.deepEqual(resolveSurfaceShadow("web", shadow), legacy);
});
