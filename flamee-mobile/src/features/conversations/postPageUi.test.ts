import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import { Children, isValidElement, type ReactElement } from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
type Element = ReactElement<any>;
function find(node: unknown, type: string): Element | undefined {
  if (!isValidElement(node)) return;
  const element = node as Element;
  if (element.type === type || typeof element.type === "function" && element.type.name === type) return element;
  return Children.toArray(element.props.children).map((child) => find(child, type)).find(Boolean);
}
test("post page puts author, text and photos into the comments list header, pins the composer and opens the full-screen viewer", () => {
  const values: unknown[] = [];
  let cursor = 0;
  const detail = { id: "post", title: "A shared memory", description: null, memory_date: "2026-11-16", author: { id: "partner", username: "Nickname", full_name: "Original", avatar_url: "https://example.test/avatar" }, images: [{ id: "photo", url: "https://example.test/full", width: 1600, height: 900 }] };
  const component = { exports: {} as { MemoryConversationScreen: (props: { memoryId: string }) => Element } };
  const source = ts.transpileModule(readFileSync(resolve("src/features/conversations/MemoryConversationScreen.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const load = (id: string): unknown => {
    if (id === "react/jsx-runtime") return require(id);
    if (id === "react") return { useEffect: () => undefined, useState: (initial: unknown) => { const index = cursor++; if (!(index in values)) values[index] = initial; return [values[index], (value: unknown) => { values[index] = value; }]; } };
    if (id === "react-native") return { KeyboardAvoidingView: "keyboard", Platform: { OS: "android" }, useWindowDimensions: () => ({ width: 390, height: 844 }) };
    if (id === "expo-router") return { useIsFocused: () => true, useRouter: () => ({ back: () => undefined }) };
    if (id === "@tanstack/react-query") return { useQuery: () => ({ data: detail, isError: false }), useQueryClient: () => ({ getQueryData: () => undefined }) };
    if (id === "tamagui") return { Text: "text", XStack: "row", YStack: "stack" };
    if (id.includes("/icons/MessageCircle")) return { MessageCircle: "icon" };
    if (id.includes("/icons/ArrowLeft")) return { ArrowLeft: "icon" };
    if (id.endsWith("/shared/components")) return Object.fromEntries(["AppButton", "AppIconButton", "AppImageViewer", "AppMediaButton", "AppProfileAvatar", "AppRemoteImage", "AppSkeleton", "AppTextButton", "AppScreen"].map((name) => [name, name]));
    if (id.endsWith("/localization/messages")) return { getMessage: (_locale: string, key: string) => key };
    if (id === "../moments") return { memoryDetailOptions: () => ({}), memoryQueryKeys: { feed: () => [] }, memoryService: {} };
    if (id === "./CommentsPanel") return { CommentsPanel: "CommentsPanel" };
    if (id === "./PostHeartAction") return { PostHeartAction: "PostHeartAction" };
    if (id === "./useConversationContext") return { useConversationContext: () => ({ scope: { accountId: "owner" }, key: "scope", ready: true, active: true }) };
    if (id.endsWith("/state/sessionStore")) return { useSessionStore: (selector: (state: unknown) => unknown) => selector({}) };
    if (id.endsWith("/containedImageFrame")) return { getContainedImageFrame: () => ({ width: 300, height: 200 }) };
    throw new Error(id);
  };
  new Function("require", "module", "exports", source)(load, component, component.exports);
  const render = () => { cursor = 0; return component.exports.MemoryConversationScreen({ memoryId: "post" }); };
  let tree = render();
  const panel = find(tree, "CommentsPanel")!;
  assert.equal(find(tree, "AppScreen")!.props.padded, false);
  assert.equal(find(tree, "AppScreen")!.props.backgroundTone, "plain");
  assert.equal(panel.props.edgeToEdge, true);
  assert.equal(find(tree, "FeatureScreen"), undefined);
  assert.equal(panel.props.scrollToLatestOnMount, false, "opening post must show its header instead of jumping to the last comment");
  const header = panel.props.header(41);
  assert.equal(find(header, "AppProfileAvatar")!.props.accessibilityLabel, "Nickname");
  assert.ok(find(header, "PostHeartAction"));
  const photo = find(header, "PostPhoto")!;
  assert.equal(photo.props.photo.id, "photo");
  photo.props.onOpen(); tree = render();
  assert.equal(find(tree, "AppImageViewer")!.props.uri, detail.images[0].url);
  assert.ok(find(find(tree, "AppImageViewer")!.props.footer, "PostHeartAction"));
  find(tree, "AppImageViewer")!.props.onClose();
  assert.equal(find(render(), "AppImageViewer"), undefined);
});
