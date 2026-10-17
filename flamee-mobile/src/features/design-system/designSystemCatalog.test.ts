import assert from "node:assert/strict";
import test from "node:test";

test("keeps every requested design-system family in the review catalog", async () => {
  const catalogModule = await import("./designSystemCatalog.ts").catch(() => null);

  assert.ok(catalogModule, "design-system catalog should exist");
  assert.deepEqual(
    catalogModule.designSystemCatalog.map((entry) => entry.id),
    ["button", "input", "card", "dialog", "sheet", "toast", "switch", "checkbox"],
  );
});

test("identifies the Tamagui implementation path for every reviewed family", async () => {
  const { designSystemCatalog } = await import("./designSystemCatalog.ts");

  for (const entry of designSystemCatalog) {
    assert.match(entry.implementation, /Tamagui\./);
    assert.ok(entry.importPath === "tamagui" || entry.importPath.startsWith("src/shared/components/"));
  }
});
