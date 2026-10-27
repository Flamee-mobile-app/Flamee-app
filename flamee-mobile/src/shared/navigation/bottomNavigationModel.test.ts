import assert from "node:assert/strict";
import test from "node:test";

test("keeps the floating navigation inside compact and tablet viewports", async () => {
  const model = await import("./bottomNavigationModel.ts").catch(() => null);

  assert.ok(model, "bottom navigation layout model should exist");
  const compact = model.getBottomNavigationLayout(320, 0);
  const tablet = model.getBottomNavigationLayout(1024, 24);

  assert.equal(compact.width, 288);
  assert.equal(compact.horizontalInset, 16);
  assert.equal(compact.bottomInset, 14);
  assert.ok(compact.fabSize >= 48);
  assert.ok(compact.totalHeight <= 100, "compact navigation should leave more room for screen content");
  assert.ok(compact.notchRadius > compact.fabSize / 2);
  assert.ok(compact.fabOutlineWidth <= 2);
  assert.equal(tablet.width, 480);
  assert.equal(tablet.horizontalInset, 272);
  assert.equal(tablet.bottomInset, 14);
});

test("the reduced pill balances the header while retaining 48px tab and FAB targets", async () => {
  const model = await import("./bottomNavigationModel.ts");
  const phone = model.getBottomNavigationLayout(390, 34);
  assert.ok(phone.barHeight <= 56);
  assert.ok(phone.fabSize <= 52);
  for (const width of [320, 360, 390, 430, 768]) {
    const layout = model.getBottomNavigationLayout(width, 34);
    const tabWidth = (layout.width / 2 - layout.notchRadius) / 2;
    assert.ok(tabWidth >= 48, `tab width at ${width}`);
    assert.ok(layout.barHeight >= 48, `tab height at ${width}`);
    assert.ok(layout.fabSize >= 48, `FAB at ${width}`);
  }
});

test("places radial actions in a symmetric fan above the FAB", async () => {
  const model = await import("./bottomNavigationModel.ts").catch(() => null);

  assert.ok(model, "bottom navigation radial model should exist");
  const positions = model.getRadialMenuPositions(3, 96);

  assert.equal(positions.length, 3);
  assert.ok(Math.abs(positions[0].x + 83.14) < 0.02);
  assert.ok(Math.abs(positions[0].y + 48) < 0.02);
  assert.ok(Math.abs(positions[1].x) < 0.02);
  assert.ok(Math.abs(positions[1].y + 96) < 0.02);
  assert.ok(Math.abs(positions[2].x - 83.14) < 0.02);
  assert.ok(Math.abs(positions[2].y + 48) < 0.02);
});

test("keeps the radial menu visually anchored to the FAB", async () => {
  const model = await import("./bottomNavigationModel.ts");
  const layout = model.getBottomNavigationLayout(390, 34);
  const surfaceGap = layout.radialRadius - layout.fabSize / 2 - 24;
  const positions = model.getRadialMenuPositions(4, layout.radialRadius);

  assert.ok(layout.radialRadius >= 96);
  assert.ok(layout.radialRadius <= 108);
  assert.ok(surfaceGap >= 40);
  assert.ok(surfaceGap <= 60);
  assert.ok(Math.abs(positions[0].x) > 90, "outer actions should widen the fan instead of increasing its radius");
  assert.ok(Math.abs(positions[1].x - positions[2].x) > 75, "inner badges need enough horizontal separation");
});

test("suppresses the primary FAB action after a long press opens the radial menu", async () => {
  const model = await import("./bottomNavigationModel.ts").catch(() => null);

  assert.ok(model, "bottom navigation gesture model should exist");
  assert.equal(model.resolveFabPress(false), "primary");
  assert.equal(model.resolveFabPress(true), "radial-menu");
});

test("builds a pill outline whose top edge dips around the center FAB", async () => {
  const model = await import("./bottomNavigationModel.ts");

  assert.equal(typeof model.buildBottomBarPath, "function");
  const path = model.buildBottomBarPath({
    width: 300,
    barTop: 40,
    barHeight: 70,
    notchRadius: 42,
  });

  assert.equal(
    path,
    "M 35 40 H 108 A 42 42 0 0 0 192 40 H 265 Q 300 40 300 75 V 75 Q 300 110 265 110 H 35 Q 0 110 0 75 V 75 Q 0 40 35 40 Z",
  );
});

test("emphasizes the selected icon without moving it", async () => {
  const model = await import("./bottomNavigationModel.ts");
  assert.equal(typeof model.getNavigationIconEmphasis, "function");

  assert.deepEqual(model.getNavigationIconEmphasis(false), { opacity: 0.68, strokeWidth: 1.8 });
  assert.deepEqual(model.getNavigationIconEmphasis(true), { opacity: 1, strokeWidth: 2.8 });
});

test("fits each selection capsule inside its tab on either side of the FAB", async () => {
  const model = await import("./bottomNavigationModel.ts");
  assert.equal(typeof model.getBottomNavigationSelection, "function");

  for (const viewport of [320, 390, 1024]) {
    const layout = model.getBottomNavigationLayout(viewport, 34);
    const leftEdgeOfNotch = layout.width / 2 - layout.notchRadius;
    const rightEdgeOfNotch = layout.width / 2 + layout.notchRadius;
    const selections = [0, 1, 2, 3].map((index) => model.getBottomNavigationSelection(layout, index)!);
    for (const selection of selections) {
      assert.ok(selection.x > 0);
      assert.ok(selection.x + selection.width < layout.width);
      assert.ok(selection.y > layout.barTop);
      assert.ok(selection.y + selection.height < layout.barTop + layout.barHeight);
      assert.equal(selection.radius, selection.height / 2);
    }
    assert.ok(selections[0].x + selections[0].width < selections[1].x);
    assert.ok(selections[1].x + selections[1].width < leftEdgeOfNotch);
    assert.ok(selections[2].x > rightEdgeOfNotch);
    assert.ok(selections[2].x + selections[2].width < selections[3].x);
    assert.ok(Math.abs(selections[0].x - (layout.width - selections[3].x - selections[3].width)) < 0.001);
  }
});

test("does not mark a regular tab when the FAB timeline or a hidden route is selected", async () => {
  const model = await import("./bottomNavigationModel.ts");
  assert.equal(typeof model.getBottomNavigationSelection, "function");
  const layout = model.getBottomNavigationLayout(390, 34);
  assert.equal(model.getBottomNavigationSelection(layout, -1), null);
  assert.equal(model.getBottomNavigationSelection(layout, 4), null);
});

test("positions the pill above the device bottom safe area", async () => {
  const model = await import("./bottomNavigationModel.ts");
  assert.equal(typeof model.getBottomNavigationFrame, "function");

  const layout = model.getBottomNavigationLayout(390, 34);
  const frame = model.getBottomNavigationFrame(layout);

  assert.equal(frame.left, layout.horizontalInset);
  assert.ok(frame.bottom >= 14);
  assert.ok(frame.bottom <= 18);
  assert.ok(frame.bottom < 34);
  assert.equal(frame.width, layout.width);
  assert.equal(frame.height, layout.barTop + layout.barHeight);
});

test("overlays the bottom navigation without reserving a blocking scene layer", async () => {
  const model = await import("./bottomNavigationModel.ts");
  assert.equal(typeof model.getBottomNavigationOverlayStyle, "function");

  const layout = model.getBottomNavigationLayout(390, 34);

  assert.deepEqual(model.getBottomNavigationOverlayStyle(layout), {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: layout.totalHeight,
  });
});
