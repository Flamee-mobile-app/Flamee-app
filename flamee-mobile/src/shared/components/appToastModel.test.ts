import assert from "node:assert/strict";
import test from "node:test";
import * as appToastModel from "./appToastModel.ts";
import { getAppToastPresentation } from "./appToastModel.ts";

test("anchors all screens to the same safe-area header gap, including landscape notches", () => {
  assert.deepEqual(appToastModel.getToastViewportFrame(390, { top: 44, left: 0, right: 0 }, 360, 16, 8), { width: 358, left: 16, top: 52 });
  assert.deepEqual(appToastModel.getToastViewportFrame(844, { top: 0, left: 44, right: 21 }, 360, 16, 8), { width: 360, left: 253.5, top: 8 });
});

test("maps system feedback to distinct accessible toast presentations", () => {
  assert.deepEqual(getAppToastPresentation("success"), {
    textColor: "$calmText",
    liveMode: "polite",
    icon: "check",
    iconSurface: "$calmSurface",
  });
  assert.equal(getAppToastPresentation("error").textColor, "$accentText");
  assert.equal(getAppToastPresentation("error").liveMode, "assertive");
  assert.equal(getAppToastPresentation("warning").textColor, "$accentText");
  assert.equal(getAppToastPresentation("info").textColor, "$textPrimary");
  assert.equal(getAppToastPresentation("loading").liveMode, "polite");
  assert.equal(getAppToastPresentation("error").icon, "error");
  assert.equal(getAppToastPresentation("warning").icon, "warning");
  assert.equal(getAppToastPresentation("info").icon, "info");
  assert.equal(getAppToastPresentation("loading").icon, "loading");
});

test("maps the toast wrapper's native label to web ARIA without losing DOM props", () => {
  const resolveProps = (appToastModel as typeof appToastModel & {
    resolveToastWebWrapperProps?: (props: Record<string, unknown>) => Record<string, unknown>;
  }).resolveToastWebWrapperProps;
  assert.ok(resolveProps);
  assert.deepEqual(resolveProps({ accessibilityLabel: "Thông báo", id: "toast-wrapper", role: "status" }), {
    "aria-label": "Thông báo", id: "toast-wrapper", role: "status",
  });
  assert.deepEqual(resolveProps({ accessibilityLabel: undefined, "aria-label": "Explicit label" }), {
    "aria-label": "Explicit label",
  });
});
