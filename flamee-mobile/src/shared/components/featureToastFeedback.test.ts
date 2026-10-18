import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

function featureTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return featureTsxFiles(path);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [path] : [];
  });
}

test("feature feedback does not render inline StatusBanner notifications", () => {
  const root = join(process.cwd(), "src/features");
  for (const file of featureTsxFiles(root)) {
    assert.doesNotMatch(
      readFileSync(file, "utf8"),
      /\bStatusBanner\b/,
      `${relative(root, file)} must use appToast for transient feedback or plain content for persistent state`,
    );
  }
});
