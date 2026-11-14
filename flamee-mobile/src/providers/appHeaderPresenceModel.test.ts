import assert from "node:assert/strict";
import test from "node:test";
import { initialAppHeaderPresence, reduceAppHeaderPresence } from "./appHeaderPresenceModel.ts";
import type { AppHeaderEntry } from "../shared/navigation/appHeaderContext.tsx";

const mood: AppHeaderEntry = { owner: "mood", route: "(main)/moments", configuration: { title: "Mood" } };

test("fullscreen check-in hides but retains the mounted header so back does not rebuild it", () => {
  const published = reduceAppHeaderPresence(initialAppHeaderPresence, { type: "publish", entry: mood });
  const hidden = reduceAppHeaderPresence(published, { type: "release", owner: mood.owner });
  assert.equal(hidden.active, null);
  assert.equal(hidden.retained, mood);
});

test("cleanup from an old route cannot clear the newly published header", () => {
  const home: AppHeaderEntry = { owner: "home", route: "(main)/index", configuration: { title: "Dòng thời gian" } };
  const moodPublished = reduceAppHeaderPresence(initialAppHeaderPresence, { type: "publish", entry: mood });
  const homePublished = reduceAppHeaderPresence(moodPublished, { type: "publish", entry: home });
  assert.equal(reduceAppHeaderPresence(homePublished, { type: "release", owner: mood.owner }).active, home);
});
