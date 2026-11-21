import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import type { ReactElement } from "react";
import ts from "typescript";
import { getAnchoredPopupLayout } from "./anchoredPopupModel.ts";
import { glassTokens, sheetTokens, spacing } from "../constants/tokens.ts";

const require = createRequire(import.meta.url);

test("native anchored dialog consumes Back and dismisses itself on outside touch without closing its sheet", () => {
  let back: (() => boolean) | undefined;
  const changes: boolean[] = [];
  const effects: (() => void)[] = [];
  const dialog = { exports: {} as { AppDialog: (props: Record<string, unknown>) => ReactElement<any> } };
  const code = ts.transpileModule(readFileSync(resolve("src/shared/components/AppDialog.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const load = (id: string): unknown => {
    if (id === "react/jsx-runtime") return require(id);
    if (id === "react") return { useState: (initial: unknown) => [initial, () => undefined], useEffect: (effect: () => void) => effects.push(effect) };
    if (id === "react-native") return { Modal: "native-modal", Pressable: "backdrop", StyleSheet: { absoluteFill: {} }, Platform: { OS: "android" }, KeyboardAvoidingView: "avoider", useWindowDimensions: () => ({ width: 390, height: 844 }), Keyboard: { metrics: () => undefined, addListener: () => ({ remove: () => undefined }) }, BackHandler: { addEventListener: (_event: string, handler: () => boolean) => { back = handler; return { remove: () => undefined }; } } };
    if (id === "react-native-safe-area-context") return { useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }) };
    if (id === "@tamagui/portal") return { Portal: "native-portal" };
    if (id === "react-native-gesture-handler") return { GestureHandlerRootView: "gesture-root" };
    if (id === "tamagui") return { Dialog: Object.assign("dialog", { Portal: "portal", Overlay: "overlay", Title: "title", Description: "description" }), ScrollView: "scroll", Text: "text", VisuallyHidden: "hidden", YStack: "stack" };
    if (id === "../constants/tokens") return { colors: { textPrimary: "#302924" }, glassTokens, sheetTokens, spacing };
    if (id === "./AppDialogContent") return { AppDialogContent: "content" };
    if (id === "./AppGradientText") return { AppGradientText: "gradient-text" };
    if (id === "./AppToast") return { AppToastModalHost: "modal-toast-host" };
    if (id === "./dialogSystemModel") return { getDialogSurfacePresentation: () => ({}) };
    if (id === "./anchoredPopupModel") return { getAnchoredPopupLayout };
    throw new Error(`Unexpected dialog dependency: ${id}`);
  };
  new Function("require", "module", "exports", code)(load, dialog, dialog.exports);
  const render = (dismissible: boolean, anchored = true) => {
    effects.length = 0;
    const result = dialog.exports.AppDialog({ open: true, ...(anchored ? { anchor: { x: 20, y: 100, width: 320, height: 60 } } : { aboveSheet: true }), title: "Actions", description: "Comment", dismissible, onOpenChange: (open: boolean) => changes.push(open) });
    if (!anchored) {
      assert.equal(result.type, "native-modal");
      assert.equal(result.props.presentationStyle, "overFullScreen");
      assert.equal(result.props.children.props.children[1].type, "modal-toast-host");
      effects.forEach((effect) => effect());
      return { ...result, props: { ...result.props, onPress: result.props.children.props.children[0].props.children.props.children[0].props.onPress } };
    }
    const element = result;
    assert.equal(element.props.children.props.zIndex, sheetTokens.zIndex + 1);
    effects.forEach((effect) => effect());
    return element.props.children.props.children[0];
  };
  const overlay = render(true);
  assert.equal(back!(), true);
  overlay.props.onPress();
  assert.deepEqual(changes, [false, false]);
  changes.length = 0;
  const locked = render(false);
  assert.equal(back!(), true);
  locked.props.onPress();
  assert.deepEqual(changes, [], "non-dismissible dialogs consume Back but stay open");
  const aboveSheet = render(true, false);
  aboveSheet.props.onRequestClose();
  aboveSheet.props.onPress();
  assert.deepEqual(changes, [false, false]);
  changes.length = 0;
  const lockedModal = render(false, false);
  lockedModal.props.onRequestClose(); lockedModal.props.onPress();
  assert.deepEqual(changes, []);
});
