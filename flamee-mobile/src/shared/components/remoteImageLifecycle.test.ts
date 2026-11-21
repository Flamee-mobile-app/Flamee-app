import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import { Children, isValidElement, type ReactElement } from "react";
import ts from "typescript";
import { shouldShowImageSkeleton } from "./appSkeletonModel.ts";

const require = createRequire(import.meta.url);
type Element = ReactElement<any>;
function elements(node: unknown, type: string): Element[] {
  if (!isValidElement(node)) return [];
  const element = node as Element;
  return [...(element.type === type ? [element] : []), ...Children.toArray(element.props.children).flatMap((child) => elements(child, type))];
}
function harness() {
  const slots: unknown[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  let errors = 0;
  const state = (initial: unknown) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], (value: unknown) => { slots[index] = value; }];
  };
  const component = { exports: {} as { AppRemoteImage: (props: Record<string, unknown>) => Element } };
  const source = ts.transpileModule(readFileSync(resolve("src/shared/components/AppRemoteImage.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const load = (id: string): unknown => {
    if (id === "react/jsx-runtime") return require(id);
    if (id === "react") return { useState: state, useRef: (initial: unknown) => state({ current: initial })[0], useMemo: (fn: () => unknown) => fn(), useEffect: (fn: () => void) => effects.push(fn) };
    if (id === "react-native") return { Image: "image", StyleSheet: { absoluteFill: {} } };
    if (id === "react-native-reanimated") return { __esModule: true, default: { View: "animated" }, cancelAnimation: () => undefined, Easing: { cubic: {}, out: () => undefined }, runOnJS: (fn: unknown) => fn, useAnimatedStyle: (fn: () => unknown) => fn(), useReducedMotion: () => false, useSharedValue: (initial: unknown) => state({ value: initial })[0], withTiming: (value: number, _options: unknown, done: (finished: boolean) => void) => { done(true); return value; } };
    if (id === "tamagui") return { YStack: "stack" };
    if (id === "./AppSkeleton") return { AppSkeleton: "skeleton" };
    if (id === "./appSkeletonModel") return { shouldShowImageSkeleton };
    if (id === "../constants/tokens") return { buttonTokens: { revealDuration: 180 } };
    throw new Error(id);
  };
  new Function("require", "module", "exports", source)(load, component, component.exports);
  return {
    render(loadFull = true) {
      cursor = 0; effects = [];
      const wrapper = component.exports.AppRemoteImage({ uri: "full", previewUri: "thumb", accessibilityLabel: "Photo", loadFull, onError: () => errors++ });
      const tree = (wrapper.type as (props: unknown) => Element)(wrapper.props);
      effects.forEach((effect) => effect());
      return { images: elements(tree, "image"), skeleton: elements(tree, "skeleton").length > 0 };
    },
    errors: () => errors,
  };
}
test("preview URL alone never removes the skeleton, and a usable preview survives a full-image failure", () => {
  const app = harness();
  let view = app.render();
  assert.equal(view.skeleton, true);
  view.images.find((image) => image.props.source.uri === "thumb")!.props.onLoad();
  view = app.render();
  assert.equal(view.skeleton, false);
  view.images.find((image) => image.props.source.uri === "full")!.props.onError();
  assert.equal(app.render().skeleton, false);
  assert.equal(app.errors(), 0);
});
test("preview failure keeps the skeleton until full decode; both failures report once", () => {
  const app = harness();
  app.render().images[0].props.onError();
  assert.equal(app.render().skeleton, true);
  app.render().images.find((image) => image.props.source.uri === "full")!.props.onLoad();
  assert.equal(app.render().skeleton, false);
  assert.equal(app.errors(), 0);
  const failed = harness();
  failed.render().images.forEach((image) => image.props.onError());
  failed.render(); failed.render();
  assert.equal(failed.errors(), 1);
});
test("offscreen cards defer full images and scrolling away never restarts an existing request", () => {
  const app = harness();
  assert.deepEqual(app.render(false).images.map((image) => image.props.source.uri), ["thumb"]);
  assert.equal(app.render(true).images.length, 2);
  assert.equal(app.render(false).images.length, 2);
});
