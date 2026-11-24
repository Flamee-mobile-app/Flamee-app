import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import { Children, isValidElement, type ReactElement } from "react";
import { QueryClient } from "@tanstack/react-query";
import ts from "typescript";
import { memoryQueryKeys, type MemoryScope } from "../moments/memoryQueries.ts";
import { isMemoryMutationScopeCurrent } from "../moments/memoryMutationScope.ts";
import { reconcileMemoryDeletion, reconcileMemoryEdit } from "./memoryEditModel.ts";
import { homeOverlayReducer, initialHomeOverlay } from "./homeOverlayModel.ts";
import { createMemoryPhotoDraft } from "./memoryPhotoDraft.ts";
import { saveMemoryEdit } from "./saveMemoryEdit.ts";
import { publishMemoryPost } from "../moments/publishMemoryPost.ts";

const require = createRequire(import.meta.url);
const scope: MemoryScope = { accountId: "a", coupleId: "pair", sessionId: 1 };
const detail = { id: "post", title: "Original", description: "Original body", memory_date: "2026-11-16", location: null, images: [] };
const tick = () => new Promise((done) => setTimeout(done, 0));
function find(node: unknown, testID: string): ReactElement<any> | undefined {
  if (!isValidElement(node)) return;
  const element = node as ReactElement<any>;
  if (element.props.testID === testID) return element;
  return Children.toArray(element.props.children).map((child) => find(child, testID)).find(Boolean);
}
function harness(file: string, service: Record<string, (...args: any[]) => unknown>) {
  const cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  cache.setQueryData(memoryQueryKeys.feed(scope), { pages: [{ items: [{ ...detail, category: "moment", is_pinned: false, thumbnail_url: null, image_count: 0 }], total: 1 }], pageParams: [0] });
  const session = { activeAccountId: "a", activeCoupleId: "pair", sessionId: 1 };
  const slots: any[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  const feedback: string[] = [];
  const appToast = { operation: () => ({ loading: (message: string) => feedback.push(`loading:${message}`), success: (message: string) => feedback.push(`success:${message}`), error: (message: string) => feedback.push(`error:${message}`), dismiss: () => undefined }) };
  let sheetDraft: any = null;
  const resetSheetDraft = () => { sheetDraft = null; };
  const state = (initial: unknown) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], (value: any) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
  };
  const code = ts.transpileModule(readFileSync(resolve(`src/features/home/${file}`), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} as Record<string, (...args: any[]) => any> };
  const load = (id: string): unknown => {
    if (id === "react/jsx-runtime") return require(id);
    if (id === "react") return { useState: state, useRef: (initial: unknown) => state({ current: initial })[0], useCallback: (fn: unknown, deps: unknown[]) => { const index = cursor++; const old = slots[index]; if (!old || !deps.every((value, i) => value === old.deps[i])) slots[index] = { fn, deps }; return slots[index].fn; }, useMemo: (fn: () => unknown) => fn(), memo: (fn: unknown) => fn, forwardRef: (fn: unknown) => fn, useImperativeHandle: (ref: any, create: () => unknown) => { ref.current = create(); },
      useReducer: (reducer: (old: unknown, action: unknown) => unknown, initial: unknown) => { const [value, set] = state(initial); return [value, (action: unknown) => (set as (fn: (old: unknown) => unknown) => void)((old) => reducer(old, action))]; },
      useEffect: (fn: () => void, deps: unknown[]) => { const index = cursor++; const old = slots[index]; if (!old || !deps.every((value, i) => value === old[i])) effects.push(fn); slots[index] = deps; } };
    if (id === "@tanstack/react-query") return { useQueryClient: () => cache };
    if (id === "tamagui") return { Text: "text", YStack: "stack" };
    if (id === "react-native") return { FlatList: "list" };
    if (id === "expo-router") return { Redirect: "redirect" };
    if (id === "expo-crypto") return { randomUUID: () => "edit-request-key" };
    if (id.endsWith("/media")) return { localMediaAdapter: { selectPhoto: service.selectLocalPhoto ?? (async () => ({ kind: "cancelled" })), cleanup: async () => undefined } };
    if (id.endsWith("/memoryPhotoDraft")) return { createMemoryPhotoDraft };
    if (id === "./saveMemoryEdit") return { saveMemoryEdit };
    if (id.endsWith("/shared/components")) return { AppButton: "button", AppDialog: "dialog", AppSheet: "sheet", AppGradientText: "gradient-text", AppField: "field", AppPhotoPicker: "picker", appToast };
    if (id.endsWith("/components/AppToast")) return { appToast };
    if (id.endsWith("/localization/messages")) return { getMessage: (_locale: string, key: string) => key };
    if (id.endsWith("/state/sessionStore")) return { useSessionStore: Object.assign((selector: (value: unknown) => unknown) => selector(session), { getState: () => session }) };
    if (id.endsWith("/moments")) return { isMemoryMutationScopeCurrent, memoryQueryKeys, memoryService: service, publishMemoryPost };
    if (id.endsWith("/constants/tokens")) return { buttonTokens: { height: 48 }, spacing: { sm: 8 } };
    if (id.endsWith("/memoryCalendarModel")) return { localCalendarDay: () => "2026-11-16" };
    if (id.endsWith("/memoryEditModel")) return { reconcileMemoryDeletion, reconcileMemoryEdit };
    if (id.endsWith("/homeOverlayModel")) return { homeOverlayReducer, initialHomeOverlay };
    if (id.endsWith("/memoryFeedModel")) return { formatMemoryDate: () => "" };
    if (id === "./MemoryComposerDialog") return { MemoryComposerDialog: "composer" };
    if (id === "./MemoryDetailView") return { MemoryDetailView: "detail" };
    if (id === "./MemoryFeedPost") return { MemoryFeedPost: "post" };
    if (id === "../../conversations") return { CommentsSheet: "comments" };
    if (id.endsWith("/useInlineMemoryEdit")) return { useInlineMemoryEdit: () => ({ editor: sheetDraft, reset: resetSheetDraft, begin: () => { sheetDraft = { id: detail.id, title: detail.title, description: detail.description, dirty: false, busy: false }; } }) };
    throw new Error(id);
  };
  new Function("require", "module", "exports", code)(load, module, module.exports);
  return { cache, session, feedback, setDirty: () => { sheetDraft.dirty = true; }, getDraft: () => sheetDraft, render(name: string, ...args: unknown[]) { cursor = 0; effects = []; const result = module.exports[name](...args); effects.forEach((fn) => fn()); return result; } };
}
test("editing stays inside the detail sheet and outside close protects dirty drafts with discard/keep choices", () => {
  const app = harness("components/HomeOverlays.tsx", {});
  const ref = { current: null as any };
  const props = { scope, records: [{ ...detail, image_count: 0 }], focused: true, blurTarget: { current: null }, clearLegacyIntent: () => undefined, onPosted: () => undefined, onRefresh: () => undefined, partial: false };
  const render = () => app.render("HomeOverlays", props, ref);
  render(); ref.current.show({ kind: "details", id: detail.id });
  let tree = render();
  tree.props.children[0].props.renderBody({ maxHeight: 500, paddingBottom: 16 }).props.onEdit(detail);
  tree = render();
  assert.equal(tree.props.children[0].props.open, true);
  assert.ok(tree.props.children[0].props.renderBody({ maxHeight: 500, paddingBottom: 16 }).props.editor);
  app.setDirty();
  render().props.children[0].props.onOpenChange(false);
  tree = render();
  assert.equal(tree.props.children[0].props.open, true);
  assert.equal(tree.props.children[1].props.aboveSheet, true);
  find(tree, "memory-keep-editing")!.props.onPress();
  assert.ok(app.getDraft());
  render().props.children[0].props.onOpenChange(false);
  find(render(), "memory-discard-confirm")!.props.onPress();
  assert.equal(render().props.children[0].props.open, false);
  assert.equal(app.getDraft(), null);
  ref.current.show({ kind: "details", id: detail.id });
  tree = render();
  tree.props.children[0].props.renderBody({ maxHeight: 500, paddingBottom: 16 }).props.onEdit(detail);
  render().props.children[0].props.onOpenChange(false);
  tree = render();
  assert.equal(tree.props.children[0].props.open, false, "unchanged prefills close without a discard prompt");
  assert.equal(tree.props.children[1], null);
  app.cache.clear();
});

test("creation reports pending then confirmed success, and a rejected create never emits a success toast", async () => {
  let resolve!: (value: unknown) => void;
  const app = harness("components/MemoryComposerDialog.tsx", { create: () => new Promise((yes) => { resolve = yes; }) });
  let posted = 0;
  const props = { open: true, blurTarget: { current: null }, onClose: () => undefined, onAfterClose: () => undefined, onPosted: () => posted++ };
  const render = () => app.render("MemoryComposerDialog", props);
  const form = Children.toArray(render().props.children).find((child) => isValidElement(child) && child.type === "field") as ReactElement<any>;
  form.props.onChangeText("New post");
  find(render().props.footer, "memory-create-submit")!.props.onPress();
  assert.deepEqual(app.feedback, ["loading:memoryComposerPosting"]);
  resolve({ ...detail, created_by: "a" }); await tick();
  assert.ok(app.feedback.includes("success:memoryComposerPosted"));
  assert.equal(posted, 1);
  const failed = harness("components/MemoryComposerDialog.tsx", { create: async () => { throw new Error("offline"); } });
  const renderFailed = () => failed.render("MemoryComposerDialog", props);
  const failedForm = Children.toArray(renderFailed().props.children).find((child) => isValidElement(child) && child.type === "field") as ReactElement<any>;
  failedForm.props.onChangeText("New post");
  find(renderFailed().props.footer, "memory-create-submit")!.props.onPress();
  await tick();
  assert.equal(failed.feedback.some((message) => message.startsWith("success:")), false);
  assert.ok(failed.feedback.includes("error:memoryComposerPostFailed"));
  app.cache.clear(); failed.cache.clear();
});
test("deletion opens an alert dialog above the detail sheet, waits for acknowledgement and prevents duplicate requests", async () => {
  let finish!: () => void;
  let calls = 0, edits = 0, deleted = 0;
  const app = harness("components/MemoryActions.tsx", { remove: () => { calls++; return new Promise<void>((resolve) => { finish = resolve; }); } });
  const props = { record: detail, scope, onDeleted: () => deleted++, onEdit: () => edits++ };
  let tree = app.render("MemoryActions", props);
  find(tree, "memory-edit-inline")!.props.onPress();
  assert.equal(edits, 1); assert.equal(calls, 0);
  find(tree, "memory-delete-start")!.props.onPress();
  tree = app.render("MemoryActions", props);
  const dialog = Children.toArray(tree.props.children).find((child) => isValidElement(child) && child.type === "dialog") as ReactElement<any>;
  assert.equal(dialog.props.aboveSheet, true);
  assert.equal(dialog.props.title, "memoryDeleteTitle");
  find(tree, "memory-delete-cancel")!.props.onPress();
  assert.equal(calls, 0);
  tree = app.render("MemoryActions", props);
  assert.equal(find(tree, "memory-delete-confirm"), undefined);
  find(tree, "memory-delete-start")!.props.onPress();
  tree = app.render("MemoryActions", props);
  const confirm = find(tree, "memory-delete-confirm")!;
  assert.ok(confirm); assert.equal(calls, 0);
  confirm.props.onPress(); confirm.props.onPress();
  await tick();
  assert.equal(calls, 1);
  assert.deepEqual(app.feedback, ["loading:memoryDeleting"], "no success toast before acknowledgement");
  assert.equal((app.cache.getQueryData(memoryQueryKeys.feed(scope)) as any).pages[0].items.length, 1);
  finish(); await tick();
  assert.equal((app.cache.getQueryData(memoryQueryKeys.feed(scope)) as any).pages[0].items.length, 0);
  assert.equal(deleted, 1); app.cache.clear();
  assert.deepEqual(app.feedback, ["loading:memoryDeleting", "success:memoryDeleted"]);
});
test("inline edit keeps the draft on API failure, accepts only a matching ack and publishes the saved post", async () => {
  let result: any = new Error("offline");
  const app = harness("useInlineMemoryEdit.ts", { update: async () => { if (result instanceof Error) throw result; return result; } });
  app.render("useInlineMemoryEdit", scope).begin(detail);
  assert.equal(app.render("useInlineMemoryEdit", scope).editor.dirty, false);
  app.render("useInlineMemoryEdit", scope).editor.setTitle("Draft");
  assert.equal(app.render("useInlineMemoryEdit", scope).editor.dirty, true);
  app.render("useInlineMemoryEdit", scope).editor.setTitle(detail.title);
  assert.equal(app.render("useInlineMemoryEdit", scope).editor.dirty, false);
  app.render("useInlineMemoryEdit", scope).editor.setTitle("Draft");
  await app.render("useInlineMemoryEdit", scope).editor.save();
  let state = app.render("useInlineMemoryEdit", scope);
  assert.equal(state.editor.title, "Draft"); assert.equal(state.editor.failed, true);
  assert.ok(app.feedback.includes("error:memoryActionError"));
  result = { ...detail, id: "wrong", title: "Wrong" };
  await state.editor.save();
  assert.equal((app.cache.getQueryData(memoryQueryKeys.feed(scope)) as any).pages[0].items[0].title, "Original");
  result = { ...detail, title: "Draft" };
  await app.render("useInlineMemoryEdit", scope).editor.save();
  assert.equal(app.render("useInlineMemoryEdit", scope).editor, null);
  assert.ok(app.feedback.includes("success:memoryUpdated"));
  assert.equal((app.cache.getQueryData(memoryQueryKeys.feed(scope)) as any).pages[0].items[0].title, "Draft"); app.cache.clear();
});
test("an acknowledgement after account switch cannot publish into the previous feed", async () => {
  let finish!: (value: unknown) => void;
  const app = harness("useInlineMemoryEdit.ts", { update: () => new Promise((resolve) => { finish = resolve; }) });
  app.render("useInlineMemoryEdit", scope).begin(detail);
  const pending = app.render("useInlineMemoryEdit", scope).editor.save();
  await tick(); app.session.activeAccountId = "b";
  finish({ ...detail, title: "Stale" }); await pending;
  assert.equal((app.cache.getQueryData(memoryQueryKeys.feed(scope)) as any).pages[0].items[0].title, "Original");
  assert.equal(app.feedback.some((message) => message.startsWith("success:")), false);
  assert.equal(app.render("useInlineMemoryEdit", { ...scope, accountId: "b" }).editor, null); app.cache.clear();
});

test("photo edit shares picker behavior, marks draft dirty and saves replacement without changing hidden legacy description", async () => {
  const calls: string[] = [];
  const initial = { ...detail, images: [{ id: "old", url: "https://example.test/old", width: 100, height: 100 }] };
  const saved = { ...detail, images: [{ id: "new", url: "https://example.test/new", width: 100, height: 100 }] };
  const app = harness("useInlineMemoryEdit.ts", {
    selectLocalPhoto: async () => ({ kind: "selected", uri: "file:///new.jpg", width: 100, height: 100 }),
    uploadEditImage: async (_scope, id, file, key) => { assert.equal(id, detail.id); assert.equal(file.uri, "file:///new.jpg"); assert.equal(key, "edit-request-key"); calls.push("upload"); return { id: "new", url: "https://example.test/new", thumbnail_url: "https://example.test/thumb" }; },
    removeImage: async (_scope, id, imageId) => { assert.equal(id, detail.id); assert.equal(imageId, "old"); calls.push("remove"); },
    update: async (_scope, _id, payload) => { assert.equal(payload.description, detail.description); calls.push("update"); return saved; },
  });
  app.render("useInlineMemoryEdit", scope).begin(initial);
  assert.equal(app.render("useInlineMemoryEdit", scope).editor.photo.uri, "https://example.test/old");
  await app.render("useInlineMemoryEdit", scope).editor.photo.select();
  let editor = app.render("useInlineMemoryEdit", scope).editor;
  assert.equal(editor.photo.uri, "file:///new.jpg"); assert.equal(editor.dirty, true);
  await editor.save();
  assert.deepEqual(calls, ["upload", "remove", "update"]);
  assert.equal(app.render("useInlineMemoryEdit", scope).editor, null);
  assert.equal((app.cache.getQueryData(memoryQueryKeys.feed(scope)) as any).pages[0].items[0].cover_image.id, "new");
  app.cache.clear();
});

test("edit form places the changeable photo first and uses only the same text field as creation", () => {
  const module = { exports: {} as { MemoryInlineEditor: (props: any) => ReactElement<any> } };
  const source = ts.transpileModule(readFileSync(resolve("src/features/home/components/MemoryInlineEditor.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function("require", "module", "exports", source)((id: string) => {
    if (id === "react/jsx-runtime") return require(id);
    if (id === "tamagui") return { YStack: "stack", XStack: "row", Text: "text" };
    if (id.endsWith("/shared/components")) return { AppPhotoPicker: "picker", AppField: "field", AppButton: "button" };
    if (id.endsWith("/localization/messages")) return { getMessage: (_locale: string, key: string) => key };
    if (id.endsWith("/constants/tokens")) return { photoPickerTokens: { height: 156 } };
    throw new Error(id);
  }, module, module.exports);
  const tree = module.exports.MemoryInlineEditor({ availableHeight: 600, editor: { title: "Post", photo: { uri: "https://example.test/photo" } } });
  const children = Children.toArray(tree.props.children) as ReactElement<any>[];
  assert.equal(children[0].type, "picker");
  const fields = children.filter((child) => child.type === "field");
  assert.equal(fields.length, 1);
  assert.equal(fields[0].props.maxLength, 200);
  assert.equal(fields[0].props.showLabel, false);
  assert.equal(children[0].props.label, "memoryComposerChangePhoto");
});
