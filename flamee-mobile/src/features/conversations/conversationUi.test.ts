import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import { Children, isValidElement, type ReactElement } from "react";
import ts from "typescript";
import { fieldTokens } from "../../shared/constants/tokens.ts";
import { mergeCommentAcknowledgement, orderCommentThreads } from "./conversationModel.ts";

const require = createRequire(import.meta.url);
type Element = ReactElement<Record<string, any>>;
function find(node: unknown, type: string): Element | undefined {
  if (!isValidElement(node)) return;
  const element = node as Element;
  if (element.type === type) return element;
  for (const child of Children.toArray(element.props.children)) {
    const match = find(child, type);
    if (match) return match;
  }
}

test("composer shows a compact inline send action only while typing and keeps the draft after failed delivery", async () => {
  const slots: unknown[] = [];
  let cursor = 0;
  const state = (initial: unknown) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], (value: unknown) => { slots[index] = value; }];
  };
  let sends = 0;
  const query = { data: { pages: [{ items: [] }] }, isPending: false, isError: false };
  const component = { exports: {} as { CommentsPanel: (props: { memoryId: string }) => Element } };
  const code = ts.transpileModule(readFileSync(resolve("src/features/conversations/CommentsPanel.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const load = (id: string): unknown => {
    if (id === "react/jsx-runtime") return require(id);
    if (id === "react") return { useState: state, useRef: (initial: unknown) => state({ current: initial })[0], useMemo: (fn: () => unknown) => fn(), useEffect: () => undefined };
    if (id === "react-native") return { FlatList: "list" };
    if (id === "expo-crypto") return { randomUUID: () => "stable-request" };
    if (id === "@tanstack/react-query") return { useInfiniteQuery: () => query, useQuery: () => ({}), useQueryClient: () => ({ invalidateQueries: () => undefined }) };
    if (id === "tamagui") return { Text: "text", XStack: "row", YStack: "stack" };
    if (id.includes("/icons/")) return { [id.split("/").at(-1)!]: "icon" };
    if (id.endsWith("/shared/components")) return { AppAnimatedAction: "animated-action", AppButton: "button", AppDialog: "dialog", AppField: "field", AppIconButton: "icon-button", AppSkeleton: "skeleton", AppTextButton: "text-button", appToast: { operation: () => ({ success: () => undefined, error: () => undefined }) } };
    if (id.endsWith("/constants/tokens")) return { fieldTokens };
    if (id.endsWith("/localization/messages")) return { getMessage: (_locale: string, key: string) => key, formatMessage: (_locale: string, key: string) => key };
    if (id === "../moments") return { memoryQueryKeys: { scope: () => [] } };
    if (id === "./conversationService") return { conversationCurrent: () => true, conversationKeys: { comments: () => [], scope: () => [] }, conversationService: { send: async () => { sends++; throw new Error("offline"); } } };
    if (id === "./conversationApi") return { ConversationError: class extends Error {} };
    if (id === "./useConversationContext") return { useConversationContext: () => ({ scope: { accountId: "owner" }, ready: true, active: true }) };
    if (id === "./CommentRow") return { CommentRow: "comment" };
    if (id === "./CommentActionsMenu") return { CommentActionsMenu: "menu" };
    if (id === "./conversationModel") return { mergeCommentAcknowledgement, orderCommentThreads };
    if (id === "../auth") return { authService: {} };
    throw new Error(`Unexpected panel dependency: ${id}`);
  };
  new Function("require", "module", "exports", code)(load, component, component.exports);
  const render = () => { cursor = 0; return component.exports.CommentsPanel({ memoryId: "memory" }); };
  let field = find(render(), "field")!;
  assert.equal(field.props.endAction.props.visible, false);
  assert.equal(field.props.autoGrowMinHeight, fieldTokens.minHeight);
  assert.equal(field.props.autoGrowPaddingHorizontal, fieldTokens.paddingHorizontal);
  assert.equal(field.props.autoGrowTextAlignVertical, "top");
  assert.equal(field.props.showLabel, false);
  field.props.onChangeText("A note");
  field = find(render(), "field")!;
  assert.equal(field.props.endAction.props.visible, true);
  assert.equal(field.props.endAction.props.children.props.testID, "comment-submit");
  assert.equal(field.props.endAction.props.children.props.disabled, false);
  field.props.endAction.props.children.props.onPress();
  await new Promise((done) => setTimeout(done, 0));
  field = find(render(), "field")!;
  assert.equal(sends, 1);
  assert.equal(field.props.value, "A note", "a failed API request must preserve the draft");
  field.props.onChangeText("");
  assert.equal(find(render(), "field")!.props.endAction.props.visible, false);
});
