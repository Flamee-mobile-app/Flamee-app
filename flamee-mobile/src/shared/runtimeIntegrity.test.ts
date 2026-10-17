import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const root = join(process.cwd(), "src");
const simulators = ["localCheckInService", "localMomentService", "localNudgeService", "localCoupleService", "localInviteService", "localOnboardingService", "localSettingsService", "localAccountLifecycleService", "PremiumPreview"];
function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sources(path) : /\.tsx?$/.test(entry.name) && !entry.name.includes(".test.") ? [path] : [];
  });
}

test("production source has no legacy business simulators or simulated persistence", () => {
  const violations: string[] = [];
  for (const path of sources(root)) {
    const source = readFileSync(path, "utf8");
    for (const name of simulators) {
      if (path.includes(name) || source.includes(name)) violations.push(`${relative(root, path)}: ${name}`);
    }
    if (/persist\s*=\s*async\s*\(\)\s*=>\s*["']saved_local/.test(source)) violations.push(relative(root, path));
  }
  assert.deepEqual(violations, []);
  assert.equal(existsSync(join(root, "demo")), false);
});
