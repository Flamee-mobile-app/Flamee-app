import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

test("notification rows show unread state while read rows remain transparent", () => {
  const require = createRequire(import.meta.url);
  const module = { exports: {} as { AppNotificationRow: (props: object) => { props: Record<string, unknown> } } };
  const code = ts.transpileModule(readFileSync(new URL("./AppNotificationRow.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const load = (id: string) => id === "tamagui" ? { Button: "button", Text: "text", XStack: "row", YStack: "stack" } : require(id);
  new Function("require", "module", "exports", code)(load, module, module.exports);
  const base = { label: "A notification", timestamp: "today", unreadLabel: "unread", icon: null, onPress: () => undefined };
  const unread = module.exports.AppNotificationRow({ ...base, unread: true });
  const read = module.exports.AppNotificationRow({ ...base, unread: false });
  assert.equal(unread.props.backgroundColor, "$supportPeachLight");
  assert.equal(read.props.backgroundColor, "transparent");
  assert.match(String(unread.props["aria-label"]), /unread/);
  assert.doesNotMatch(String(read.props["aria-label"]), /unread/);
  assert.equal(unread.props.borderRadius, 0);
});
