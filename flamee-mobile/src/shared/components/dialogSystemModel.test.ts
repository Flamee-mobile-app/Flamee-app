import assert from "node:assert/strict";
import test from "node:test";
import { getDialogSurfacePresentation } from "./dialogSystemModel.ts";

test("renders a solid dialog as an opaque white surface without glass effects", () => {
  assert.deepEqual(getDialogSurfacePresentation("solid"), {
    backgroundColor: "$white",
    backdropFilter: "none",
    backgroundImage: "none",
    boxShadow: "none",
  });
});
