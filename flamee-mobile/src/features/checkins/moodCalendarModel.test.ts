import assert from "node:assert/strict";
import test from "node:test";
import { moodCalendarCells, moveMoodPeriod } from "./moodCalendarModel.ts";

test("mood week starts Monday and crosses month/year boundaries without fabricating entries", () => {
  assert.deepEqual(moodCalendarCells("2027-01-01", "week"), ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
});
test("mood month pads a seven-column leap-year calendar and rejects invalid dates", () => {
  const cells = moodCalendarCells("2024-02-29", "month");
  assert.equal(cells.length % 7, 0);
  assert.equal(cells.filter(Boolean).length, 29);
  assert.equal(cells[3], "2024-02-01");
  assert.deepEqual(moodCalendarCells("2025-02-29", "month"), []);
});
test("changing a month from its last day never skips February", () => {
  assert.equal(moveMoodPeriod("2026-01-31", "month", 1), "2026-02-01");
  assert.equal(moveMoodPeriod("2026-01-01", "month", -1), "2025-12-01");
  assert.equal(moveMoodPeriod("2026-12-28", "week", 1), "2027-01-04");
});
