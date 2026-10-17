import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const sourceRoots = [join(projectRoot, "src", "features"), join(projectRoot, "app")];

function listTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return listTsxFiles(path);
    }

    return entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx") ? [path] : [];
  });
}

function sourceFiles() {
  return sourceRoots.flatMap(listTsxFiles).map((path) => ({
    path,
    relativePath: relative(join(projectRoot, "src"), path).replaceAll("\\", "/"),
    source: readFileSync(path, "utf8"),
  }));
}

function allTsxSourceFiles() {
  return [join(projectRoot, "src"), join(projectRoot, "app")].flatMap(listTsxFiles).map((path) => ({
    path,
    relativePath: relative(join(projectRoot, "src"), path).replaceAll("\\", "/"),
    source: readFileSync(path, "utf8"),
  }));
}

function findRawTamaguiButtonImports({ allow = [] }: { allow?: string[] } = {}) {
  return sourceFiles()
    .filter(({ relativePath }) => !allow.includes(relativePath))
    .filter(({ source }) => {
      const tamaguiImports = source.matchAll(/import\s*{([^}]+)}\s*from\s*["']tamagui["']/gs);
      return [...tamaguiImports].some((match) =>
        match[1]
          .split(",")
          .map((name) => name.trim().split(/\s+as\s+/)[0])
          .includes("Button"),
      );
    })
    .map(({ relativePath }) => relativePath)
    .sort();
}

function findIdentifierConsumers(identifier: string) {
  const importPattern = new RegExp(`import\\s*{[^}]*\\b${identifier}\\b[^}]*}\\s*from`, "s");

  return sourceFiles()
    .filter(({ source }) => importPattern.test(source))
    .map(({ relativePath }) => relativePath)
    .sort();
}

function findAppButtonVisualOverrides() {
  const forbiddenAttribute = /(?:^|\s)(backgroundColor|borderColor|borderRadius|shadow\w*|pressStyle|animation|transition|minHeight|paddingHorizontal|alignSelf|justifyContent|flex)\s*=/g;
  const componentDefinitions = new Set(["shared/components/AppButton.tsx"]);

  return allTsxSourceFiles().flatMap(({ relativePath, source }) => {
    if (componentDefinitions.has(relativePath)) return [];

    const violations = [...source.matchAll(/<AppButton\b([\s\S]*?)(?:\/>|>)/g)].flatMap((match) => {
      const attributes = match[1];
      const names = [...attributes.matchAll(forbiddenAttribute)].map((item) => item[1]);
      if (attributes.includes("homeShadows.heroCta")) names.push("homeShadows.heroCta");
      return names;
    });

    return violations.length ? [`${relativePath}: ${[...new Set(violations)].join(", ")}`] : [];
  }).sort();
}

test("feature screens do not import Tamagui Button directly", () => {
  const offenders = findRawTamaguiButtonImports({
    allow: ["features/moments/components/MomentReactionButton.tsx"],
  });

  assert.deepEqual(offenders, [], `Raw Tamagui Button imports:\n${offenders.join("\n")}`);
});

test("features no longer depend on ChoiceChip", () => {
  const offenders = findIdentifierConsumers("ChoiceChip");

  assert.deepEqual(offenders, [], `ChoiceChip consumers:\n${offenders.join("\n")}`);
});

test("AppButton callers do not override the shared visual contract", () => {
  const offenders = findAppButtonVisualOverrides();

  assert.deepEqual(offenders, [], `AppButton visual overrides:\n${offenders.join("\n")}`);
});
