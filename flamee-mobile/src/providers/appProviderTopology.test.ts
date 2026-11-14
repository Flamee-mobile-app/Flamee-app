import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import { createElement, Fragment, type ComponentType, type PropsWithChildren, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { renderToStaticMarkup } = require("react-dom/server") as { renderToStaticMarkup: (node: ReactNode) => string };

test("the native portal host and route content share the root QueryClient, including recovery UI", () => {
  let headerHosts = 0;
  const client = new QueryClient();
  client.setQueryData(["confirmed-memory"], "same-cache");
  function QueryConsumer() {
    const current = useQueryClient();
    assert.equal(current, client);
    return createElement("span", null, current.getQueryData<string>(["confirmed-memory"]));
  }
  const passthrough = ({ children }: PropsWithChildren) => createElement(Fragment, null, children);
  // Tamagui's native fallback host is a sibling of its children, not a React
  // context-preserving portal. Exercise both real hook consumers at that boundary.
  const tamagui = ({ children }: PropsWithChildren) => createElement(Fragment, null, children, createElement(QueryConsumer));
  const filename = resolve("app/_layout.tsx");
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} as Record<string, ComponentType<{ retry: () => void }>> };
  const load = (id: string): unknown => {
    if (id === "react/jsx-runtime") return require(id);
    if (id.endsWith("/QueryProvider")) return { QueryProvider: ({ children }: PropsWithChildren) => createElement(QueryClientProvider, { client }, children) };
    if (id.endsWith("/TamaguiProvider")) return { TamaguiProvider: tamagui };
    if (id === "expo-router") return { Stack: QueryConsumer };
    if (id === "react-native") return { View: passthrough };
    if (id === "react-native-gesture-handler") return { GestureHandlerRootView: passthrough };
    if (id === "react-native-safe-area-context") return { SafeAreaProvider: passthrough };
    if (id === "expo-status-bar") return { StatusBar: () => null };
    if (id.endsWith("/shared/components")) return { AppScreen: passthrough, AppToastProvider: passthrough };
    if (id.endsWith("/FoundationScreen")) return { FoundationScreen: QueryConsumer };
    if (id.endsWith("/SessionInitializer")) return { SessionInitializer: passthrough };
    if (id.endsWith("/AppHeaderProvider")) return { AppHeaderProvider: ({ children }: PropsWithChildren) => { headerHosts++; return createElement(Fragment, null, children); } };
    if (id.endsWith("/StartupProvider")) return { StartupProvider: passthrough, revealStartupError: () => undefined };
    if (id.endsWith("/constants/tokens")) return { colors: { background: "#FFFFFF" } };
    throw new Error(`Unexpected root dependency: ${id}`);
  };
  new Function("require", "module", "exports", source)(load, module, module.exports);
  for (const component of [module.exports.default, module.exports.ErrorBoundary]) {
    assert.equal(renderToStaticMarkup(createElement(component, { retry: () => undefined })).match(/same-cache/g)?.length, 2);
  }
  assert.equal(headerHosts, 1, "The application layout mounts one global header host; recovery does not duplicate it.");
  client.clear();
});
