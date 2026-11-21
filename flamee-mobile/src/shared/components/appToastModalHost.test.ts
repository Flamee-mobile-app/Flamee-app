import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import { Children, isValidElement, type ReactElement } from "react";
import ts from "typescript";
import { createAppToastHostState } from "./appToastHostState.ts";
import { createAppToastState } from "./appToastState.ts";
import { getToastViewportFrame } from "./appToastModel.ts";
import { spacing, toastTokens } from "../constants/tokens.ts";

const require = createRequire(import.meta.url);
type Element = ReactElement<any>;
function find(node: unknown, name: string): Element | undefined {
  if (!isValidElement(node)) return;
  const element = node as Element;
  if (element.type === name || typeof element.type === "function" && element.type.name === name) return element;
  return Children.toArray(element.props.children).map((child) => find(child, name)).find(Boolean);
}
test("one toast moves from root to a named in-modal viewport and back with the same result", () => {
  const source = ts.transpileModule(readFileSync(resolve("src/shared/components/AppToast.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const slots = new Map<string, any[]>();
  const effects = new Map<string, (() => void)[]>();
  let owner = "root", cursor = 0;
  const component = { exports: {} as Record<string, any> };
  const load = (id: string): unknown => {
    if (id === "react/jsx-runtime") return require(id);
    if (id === "react") return {
      useId: () => owner,
      useRef: (initial: unknown) => { const i = cursor++; const state = slots.get(owner)!; return state[i] ?? (state[i] = { current: initial }); },
      useEffect: () => undefined,
      useLayoutEffect: (fn: () => (() => void) | void, deps: unknown[]) => {
        const i = cursor++; const state = slots.get(owner)!;
        if (!state[i] || !deps.every((value, index) => value === state[i][index])) { const cleanup = fn(); if (cleanup) effects.get(owner)!.push(cleanup); state[i] = deps; }
      },
      useSyncExternalStore: (_subscribe: unknown, snapshot: () => unknown) => snapshot(),
    };
    if (id === "react-native") return { Platform: { OS: "android" }, useWindowDimensions: () => ({ width: 390 }), AppState: { currentState: "active" } };
    if (id === "expo-router") return { usePathname: () => "/home" };
    if (id === "react-native-reanimated") return { useReducedMotion: () => false };
    if (id === "react-native-safe-area-context") return { useSafeAreaInsets: () => ({ top: 24, left: 0, right: 0 }) };
    if (id === "react-native-screens") return { FullWindowOverlay: "full-overlay" };
    if (id === "@tamagui/toast") return { Toast: "toast", ToastProvider: "provider", ToastViewport: "viewport" };
    if (id === "tamagui") return { XStack: "row", YStack: "stack" };
    if (id.includes("/icons/")) return { [id.split("/").at(-1)!]: "icon" };
    if (id === "../constants/tokens") return { spacing, toastTokens };
    if (id === "../state/sessionStore") return { useSessionStore: { subscribe: () => () => undefined } };
    if (id === "../localization/messages") return { getMessage: (_locale: string, key: string) => key };
    if (id === "./appToastState") return { createAppToastState };
    if (id === "./appToastHostState") return { createAppToastHostState };
    if (id === "./appToastModel") return { getToastViewportFrame };
    if (id === "./surfaceShadow") return {};
    throw new Error(id);
  };
  new Function("require", "module", "exports", source)(load, component, component.exports);
  const render = (name: string, modal = false) => {
    owner = name; cursor = 0;
    if (!slots.has(name)) { slots.set(name, []); effects.set(name, []); }
    return modal ? component.exports.AppToastModalHost({ active: true }) : component.exports.AppToastProvider({ children: null });
  };
  render("root");
  component.exports.appToast.success("Confirmed result");
  const initial = find(render("root"), "AppToastItem")!.props.item;
  const modal = render("dialog", true);
  assert.equal(find(modal, "AppToastItem")!.props.item.id, initial.id);
  assert.equal(find(modal, "viewport")!.props.portalToRoot, false);
  assert.equal(find(modal, "viewport")!.props.name, find(modal, "AppToastItem")!.props.viewportName);
  assert.equal(find(render("root"), "AppToastItem"), undefined);
  effects.get("dialog")!.forEach((cleanup) => cleanup());
  assert.equal(find(render("root"), "AppToastItem")!.props.item.id, initial.id);
  component.exports.appToast.dismiss();
});
