import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import type { ReactElement } from "react";
import ts from "typescript";
import { avatarObjectKey, resolveProfileAvatar } from "./profileAvatarModel.ts";

const require = createRequire(import.meta.url);
test("avatar renewal keeps the loaded image and retries a failing asset once without accepting stale image events", () => {
  const slots: unknown[] = [];
  let cursor = 0;
  let refreshes = 0;
  const state = (initial: unknown) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], (value: unknown) => { slots[index] = value; }];
  };
  const component = { exports: {} as { AppProfileAvatar: (props: Record<string, unknown>) => ReactElement<any> } };
  const source = ts.transpileModule(readFileSync(resolve("src/shared/components/AppProfileAvatar.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const load = (id: string): unknown => {
    if (id === "react/jsx-runtime") return require(id);
    if (id === "react") return { useState: state, useRef: (initial: unknown) => state({ current: initial })[0], useMemo: (fn: () => unknown) => fn() };
    if (id === "react-native") return { Image: "image" };
    if (id === "tamagui") return { YStack: "stack" };
    if (id === "./profileAvatarModel") return { avatarObjectKey, resolveProfileAvatar };
    if (id === "./AppSkeleton") return { AppSkeleton: "avatar-skeleton" };
    if (id.endsWith(".png")) return 1;
    throw new Error(id);
  };
  new Function("require", "module", "exports", source)(load, component, component.exports);
  const old = "https://example.test/storage/v1/object/sign/media/avatar.jpg?token=old";
  const next = old.replace("token=old", "token=new");
  const render = (uri: string | null, seed = "owner", loading = false) => {
    cursor = 0;
    return component.exports.AppProfileAvatar({ uri, fallbackSeed: seed, loading, size: 40, accessibilityLabel: "Avatar", onRefresh: () => refreshes++ }).props.children;
  };
  let images = render(old);
  images[0].props.onLoad();
  images = render(next);
  assert.equal(images[0].props.source.uri, old);
  assert.equal(images[1].props.source.uri, next);
  images[1].props.onError();
  assert.equal(refreshes, 1);
  images = render(old.replace("token=old", "token=retry"));
  images[1].props.onError();
  assert.equal(refreshes, 1, "new signed tokens for the same bad asset must not loop recovery");
  images = render(next, "another-account");
  assert.equal(images[0].props.source.uri, next, "another account cannot reuse the previous account's bitmap");
  const staleLoad = images[0].props.onLoad;
  images = render("https://example.test/new-avatar.jpg", "another-account");
  staleLoad();
  assert.equal(render("https://example.test/new-avatar.jpg", "another-account")[0].props.source.uri, "https://example.test/new-avatar.jpg");
  assert.equal(render(null)[0].props.source, 1, "explicit avatar removal takes effect immediately");
  assert.equal(render(null, "owner", true)[0].type, "avatar-skeleton", "unresolved profile data must never display a made-up default portrait");
});
