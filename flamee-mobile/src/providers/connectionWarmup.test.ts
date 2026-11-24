import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import ts from "typescript";
import { connectionOptions } from "../features/invites/connectionQueries.ts";

const require = createRequire(import.meta.url);
const tick = () => new Promise((done) => setTimeout(done, 0));
test("startup warms the same connection/avatar cache before Mood focus and foreground deduplicates fresh requests", async () => {
  const cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const session = { activeAccountId: "a", activeCoupleId: "pair" as string | null, sessionId: 1, isBootstrapped: true, activeAvatarUrl: "https://example.test/a.jpg" };
  let reads = 0;
  const images: string[] = [];
  let foreground: ((state: string) => void) | undefined;
  const slots: any[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  const component = { exports: {} as { ConnectionWarmup: () => null } };
  const source = ts.transpileModule(readFileSync(resolve("src/providers/ConnectionWarmup.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const load = (id: string): unknown => {
    if (id === "react") return { useRef: (initial: unknown) => { const index = cursor++; return slots[index] ?? (slots[index] = { current: initial }); },
      useEffect: (fn: () => unknown, deps: unknown[]) => { const index = cursor++; const old = slots[index]; if (!old || !deps.every((value, i) => value === old.deps[i])) effects.push(() => { old?.cleanup?.(); slots[index] = { deps, cleanup: fn() }; }); } };
    if (id === "react-native") return { AppState: { addEventListener: (_name: string, fn: (state: string) => void) => { foreground = fn; return { remove: () => { foreground = undefined; } }; } } };
    if (id === "@tanstack/react-query") return { useQueryClient: () => cache, useQuery: (options: any) => { if (options.enabled) void cache.fetchQuery(options); return { data: cache.getQueryData(options.queryKey), isError: false }; } };
    if (id === "../features/invites") return { connectionOptions, inviteService: { connection: async () => { reads++; return { id: "pair", status: "active", partner1: { id: "a", full_name: "A", avatar_url: session.activeAvatarUrl }, partner2: { id: "b", full_name: "B", avatar_url: "https://example.test/b.jpg" } }; } } };
    if (id === "../shared/state/sessionStore") return { useSessionStore: Object.assign((select: (value: unknown) => unknown) => select(session), { getState: () => session }) };
    if (id === "../shared/media/imagePrefetch") return { prefetchRemoteImage: async (uri: string) => { images.push(uri); return true; } };
    throw new Error(id);
  };
  new Function("require", "module", "exports", source)(load, component, component.exports);
  const render = () => { cursor = 0; effects = []; component.exports.ConnectionWarmup(); effects.forEach((fn) => fn()); };
  render(); await tick(); render(); await tick();
  assert.equal(reads, 1);
  assert.deepEqual(images, ["https://example.test/a.jpg", "https://example.test/b.jpg"]);
  foreground!("active"); await tick(); render(); await tick();
  assert.equal(reads, 1); assert.equal(images.length, 2);
  session.activeAccountId = "other"; session.activeCoupleId = null; session.sessionId = 2; session.activeAvatarUrl = "https://example.test/other.jpg";
  render(); await tick();
  assert.equal(reads, 1);
  assert.equal(images.at(-1), session.activeAvatarUrl);
  cache.clear();
});
