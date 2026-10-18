import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("presses filled buttons into their shadow without changing the surface color", async () => {
  const model = await import("./buttonSystemModel.ts");

  for (const variant of ["primary", "secondary", "destructive"] as const) {
    const { base, press } = model.getAppButtonPresentation(variant);
    assert.equal(press.backgroundColor, base.backgroundColor, variant);
    assert.ok(press.transform[0].translateY >= 2 && press.transform[0].translateY <= 4, variant);
    assert.ok(press.shadowOffset.height < base.shadowOffset.height, variant);
    assert.ok(press.shadowRadius < base.shadowRadius, variant);
    assert.ok(press.shadowOpacity < base.shadowOpacity, variant);
  }
});

test("keeps pointer feedback distinct from persistent selection styling", async () => {
  const model = await import("./buttonSystemModel.ts");
  const ghost = model.getAppButtonPresentation("ghost");
  assert.equal(ghost.press.backgroundColor, ghost.base.backgroundColor);

  for (const selected of [false, true]) {
    for (const tone of ["neutral", "accent", "danger"] as const) {
      const icon = model.getIconButtonPresentation(tone, selected);
      assert.equal(icon.pressBackgroundColor, icon.backgroundColor);
    }
    const chip = model.getFilterChipPresentation(selected);
    assert.equal(chip.pressBackgroundColor, chip.backgroundColor);
  }
  assert.notEqual(model.getFilterChipPresentation(true).backgroundColor, model.getFilterChipPresentation(false).backgroundColor);
});

test("gives unselected filters a glass surface while keeping both states borderless", async () => {
  const { getFilterChipPresentation } = await import("./buttonSystemModel.ts");
  const inactive = getFilterChipPresentation(false);
  const active = getFilterChipPresentation(true);

  assert.equal(inactive.backgroundColor, "$glassFilter");
  assert.equal(inactive.borderColor, "transparent");
  assert.equal(active.borderColor, "transparent");
  assert.notEqual(active.backgroundColor, "transparent");
});

test("keeps glass action borders absent in every press state", async () => {
  const { getAppButtonPresentation } = await import("./buttonSystemModel.ts");
  const glass = getAppButtonPresentation("ghost");

  assert.equal(glass.base.borderWidth, 0);
  assert.equal(glass.base.borderColor, "transparent");
  assert.equal(glass.press.backgroundColor, glass.base.backgroundColor);
});

test("renders the avatar edit action as a circular translucent peach bubble", async () => {
  const model = await import("./buttonSystemModel.ts");
  const { buttonTokens } = await import("../constants/tokens.ts");
  const avatar = model.getIconButtonPresentation("avatar", false);

  assert.equal(avatar.backgroundColor, "$glassCardPeach");
  assert.equal(avatar.hoverBackgroundColor, "$glassCardPeach");
  assert.equal(avatar.pressBackgroundColor, "$glassCardPeach");
  assert.equal(model.getIconButtonRadius("avatar"), buttonTokens.iconButtonSize / 2);
});

test("keeps loading content footprint while blocking interaction", async () => {
  const model = await import("./buttonSystemModel.ts");

  assert.deepEqual(model.resolveAppButtonState({ disabled: false, loading: true }), {
    disabled: true,
    busy: true,
    contentOpacity: 0,
  });
  assert.deepEqual(model.resolveAppButtonState({ disabled: true, loading: false }), {
    disabled: true,
    busy: false,
    contentOpacity: 1,
  });
});

test("provides a 48 pixel target for compact filters and icon actions", async () => {
  const { buttonTokens } = await import("../constants/tokens.ts");

  assert.equal(buttonTokens.filterHeight + buttonTokens.filterHitSlop * 2, 48);
  assert.equal(buttonTokens.iconButtonSize + buttonTokens.iconButtonHitSlop * 2, 48);
});

test("maps filter selection mode to accessible checked controls", async () => {
  const model = await import("./buttonSystemModel.ts");

  assert.deepEqual(model.resolveFilterSemantics("single", true), { role: "radio", checked: true });
  assert.deepEqual(model.resolveFilterSemantics("multiple", false), { role: "checkbox", checked: false });
});

test("keeps native accessibilityState off the web DOM", async () => {
  const model = await import("./buttonSystemModel.ts");
  const state = { disabled: true, busy: false };

  assert.deepEqual(model.resolvePlatformAccessibilityProps("web", state), {});
  assert.deepEqual(model.resolvePlatformAccessibilityProps("ios", state), { accessibilityState: state });
  assert.deepEqual(model.resolvePlatformAccessibilityProps("android", state), { accessibilityState: state });
});

test("lets paired actions shrink without changing their visual contract", async () => {
  const model = await import("./buttonSystemModel.ts");

  assert.deepEqual(model.resolveAppButtonLayout({ grow: true, fill: false, contentAlign: "center" }), {
    alignSelf: "auto",
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  });
});

test("keeps the button transition on Tamagui's platform-aware animation driver", async () => {
  const configSource = readFileSync(join(process.cwd(), "tamagui.config.ts"), "utf8");
  const { defaultConfig } = await import("@tamagui/config/v4");

  assert.doesNotMatch(configSource, /@tamagui\/animations-react-native/);
  assert.match(configSource, /animations:\s*defaultConfig\.animations/);
  assert.equal(defaultConfig.animations.outputStyle, "css");
});
