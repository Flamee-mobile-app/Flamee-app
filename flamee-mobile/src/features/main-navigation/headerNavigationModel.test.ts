import assert from "node:assert/strict";
import test from "node:test";
import { getHeaderDestinationRoute, headerDestinations, isHomeHeaderRoute, resolveHeaderDestination } from "./headerNavigationModel.ts";

test("the global header menu contains every current tab and both Home features", () => {
  assert.deepEqual(headerDestinations.map((item) => item.id), ["timeline", "memories", "moments", "tasks", "profile"]);
  assert.equal(new Set(headerDestinations.map((item) => item.id)).size, headerDestinations.length);
});
test("header selection follows the actual route, including nested features and the FAB alias", () => {
  assert.equal(resolveHeaderDestination("(main)/index", "memories"), "memories");
  assert.equal(resolveHeaderDestination("(main)/timeline", "timeline"), "timeline");
  assert.equal(resolveHeaderDestination("(main)/moments", "memories"), "moments");
  assert.equal(resolveHeaderDestination("mood/history"), "moments");
  assert.equal(resolveHeaderDestination("(main)/tasks"), "tasks");
  assert.equal(resolveHeaderDestination("settings"), "profile");
});
test("menu navigation targets existing routes and Home views without private route parameters", () => {
  assert.deepEqual(getHeaderDestinationRoute("memories"), { pathname: "/(main)", params: { view: "memories" } });
  assert.deepEqual(getHeaderDestinationRoute("moments"), { pathname: "/(main)/moments" });
  assert.equal(isHomeHeaderRoute("(main)/timeline"), true);
  assert.equal(isHomeHeaderRoute("(main)/profile"), false);
});
