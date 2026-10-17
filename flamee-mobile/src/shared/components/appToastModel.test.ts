import assert from "node:assert/strict";
import test from "node:test";
import * as appToastModel from "./appToastModel.ts";
import { getAppToastPresentation } from "./appToastModel.ts";

test("maps system feedback to distinct accessible toast presentations", () => {
  assert.deepEqual(getAppToastPresentation("success"), {
    textColor: "$calmText",
    liveMode: "polite",
  });
  assert.equal(getAppToastPresentation("error").textColor, "$accentText");
  assert.equal(getAppToastPresentation("error").liveMode, "assertive");
  assert.equal(getAppToastPresentation("warning").textColor, "$accentText");
  assert.equal(getAppToastPresentation("info").textColor, "$textPrimary");
  assert.equal(getAppToastPresentation("loading").liveMode, "polite");
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
