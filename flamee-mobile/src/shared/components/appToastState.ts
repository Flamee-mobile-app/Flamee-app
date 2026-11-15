import type { AppToastTone } from "./appToastModel.ts";
import { getMessage, type Locale } from "../localization/messages.ts";

type Tone = Exclude<AppToastTone, "default">;
export type AppToastOptions = { description?: string; duration?: number; locale?: Locale; operationId?: number };
export type AppToastMessage = { id: number; tone: Tone; title: string; description?: string; duration: number; open: boolean; locale?: Locale };

type TimerId = ReturnType<typeof setTimeout> | number;
type Clock = { now?: () => number; setTimeout?: (run: () => void, delay: number) => TimerId; clearTimeout?: (id: TimerId) => void; loadingTimeout?: number; exitDuration?: number };

// One timer owner for native/web, background pauses, remounts and stale operations.
export function createAppToastState(defaultDuration: number, clock: Clock = {}) {
  let sequence = 0;
  let operation = 0;
  let current: AppToastMessage | null = null;
  let active = false;
  let paused = false;
  let timer: TimerId | undefined;
  let removalTimer: TimerId | undefined;
  let started = 0;
  let remaining = 0;
  const now = clock.now ?? Date.now;
  const schedule = clock.setTimeout ?? setTimeout;
  const cancel = clock.clearTimeout ?? clearTimeout;
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach((listener) => listener());
  const stop = () => { if (timer !== undefined) cancel(timer); timer = undefined; };
  const stopRemoval = () => { if (removalTimer !== undefined) cancel(removalTimer); removalTimer = undefined; };
  const close = () => {
    if (!current?.open) return;
    stop(); stopRemoval();
    const id = current.id;
    current = { ...current, open: false };
    removalTimer = schedule(() => {
      removalTimer = undefined;
      if (current?.id !== id || current.open) return;
      current = null;
      publish();
    }, clock.exitDuration ?? 180);
    publish();
  };
  const start = () => {
    stop();
    if (!active || paused || !current?.open) return;
    started = now();
    const id = current.id;
    timer = schedule(() => {
      timer = undefined;
      if (!current?.open || current.id !== id) return;
      if (current.tone === "loading") {
        const locale = current.locale ?? "vi";
        // A delayed response is unknown, not proof that a server write failed.
        current = { id: ++sequence, tone: "warning", title: getMessage(locale, "toastResultPending"), description: getMessage(locale, "toastResultPendingBody"), duration: defaultDuration, open: true, locale };
        remaining = defaultDuration;
        start();
        publish();
      } else close();
    }, remaining);
  };
  const state = {
    getSnapshot: () => current,
    getServerSnapshot: () => null,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    begin() {
      if (current?.tone === "loading") state.dismiss(current.id);
      operation = ++sequence;
      return operation;
    },
    show(tone: Tone, title: string, options?: AppToastOptions) {
      if (options?.operationId !== undefined && options.operationId !== operation) return -1;
      stopRemoval();
      const id = ++sequence;
      if (options?.operationId === undefined) operation = id;
      const duration = options?.duration;
      const resultDuration = duration !== undefined && Number.isFinite(duration) && duration > 0 ? duration : defaultDuration;
      current = { id, tone, title, description: options?.description, duration: tone === "loading" ? Infinity : resultDuration, open: true, ...(options?.locale ? { locale: options.locale } : {}) };
      paused = false;
      remaining = tone === "loading" ? clock.loadingTimeout ?? 45000 : resultDuration;
      start();
      publish();
      return id;
    },
    dismiss(id?: string | number) {
      if (!current || !current.open || id !== undefined && id !== current.id) return;
      close();
    },
    setActive(next: boolean) {
      if (active === next) return;
      if (!next && timer !== undefined) remaining = Math.max(0, remaining - (now() - started));
      active = next;
      if (next) start(); else stop();
    },
    setPaused(next: boolean) {
      if (paused === next) return;
      if (next && timer !== undefined) remaining = Math.max(0, remaining - (now() - started));
      paused = next;
      if (next) stop(); else start();
    },
    changeRoute() {
      operation = ++sequence;
      if (current?.tone === "loading") state.dismiss(current.id);
    },
    reset() { stop(); stopRemoval(); operation = ++sequence; current = null; remaining = 0; paused = false; publish(); },
  };
  return state;
}
