import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function renderHeart({ readError = false, current = true, readFails = true } = {}) {
  let isCurrent = current;
  const events: string[] = [];
  const source = ts.transpileModule(readFileSync(resolve("src/features/conversations/PostHeartAction.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} as { PostHeartAction: (props: { memoryId: string }) => any } };
  const load = (id: string): unknown => {
    if (id === "react/jsx-runtime") return require(id);
    if (id === "react") return { useRef: (value: unknown) => ({ current: value }), useState: (value: unknown) => [value, () => undefined] };
    if (id.includes("/icons/Heart")) return { Heart: "Heart" };
    if (id === "@tanstack/react-query") return {
      useQuery: () => ({ data: readError ? undefined : { memory_id: "post", hearted: false, heart_count: 0 }, isError: readError, isPending: false,
        refetch: async () => { events.push("read"); return { isError: readFails, data: readFails ? undefined : { memory_id: "post", hearted: false, heart_count: 0 } }; } }),
      useQueryClient: () => ({ cancelQueries: async () => undefined, setQueryData: () => events.push("cache"), invalidateQueries: async () => undefined }),
    };
    if (id.endsWith("/shared/components")) return { AppTextButton: "button", appToast: { operation: () => ({
      loading: (key: string) => events.push(`loading:${key}`), success: (key: string) => events.push(`success:${key}`),
      error: (key: string) => events.push(`error:${key}`), dismiss: () => undefined,
    }) } };
    if (id.endsWith("/constants/tokens")) return { colors: { primary: "orange" } };
    if (id.endsWith("/localization/messages")) return { getMessage: (_locale: string, key: string) => key };
    if (id === "./useConversationContext") return { useConversationContext: () => ({ scope: {}, ready: true, active: true }) };
    if (id === "./conversationService") return { conversationKeys: { scope: () => [] }, conversationCurrent: () => isCurrent,
      conversationService: { postHeart: async () => { events.push("write"); return { memory_id: "post", hearted: true, heart_count: 1 }; } } };
    throw new Error(`Unexpected dependency: ${id}`);
  };
  new Function("require", "module", "exports", source)(load, module, module.exports);
  return { events, button: module.exports.PostHeartAction({ memoryId: "post" }), setCurrent: (value: boolean) => { isCurrent = value; } };
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test("retrying unavailable post hearts reports read failure instead of silently doing nothing", async () => {
  const { button, events } = renderHeart({ readError: true });
  button.props.onPress(); await flush();
  assert.ok(events.includes("read"));
  assert.ok(events.some((event) => event.startsWith("loading:")));
  assert.ok(events.includes("error:memoryHeartUnavailable"));
  assert.equal(events.includes("write"), false);
});

test("heart writes show loading then success only after an acknowledgement in the same scope", async () => {
  const { button, events } = renderHeart();
  button.props.onPress(); await flush();
  assert.ok(events[0].startsWith("loading:"));
  assert.ok(events.indexOf("write") < events.indexOf("success:memoryHeartAdded"));
  assert.ok(events.includes("cache"));
  const switched = renderHeart();
  switched.button.props.onPress(); switched.setCurrent(false); await flush();
  assert.equal(switched.events.some((event) => event.startsWith("success:") || event === "cache"), false);
});

test("recovering the heart state confirms the read without silently adding a like", async () => {
  const { button, events } = renderHeart({ readError: true, readFails: false });
  button.props.onPress(); await flush();
  assert.ok(events.includes("success:memoryHeartLoaded"));
  assert.equal(events.includes("write"), false);
  assert.equal(events.includes("success:memoryHeartAdded"), false);
});
