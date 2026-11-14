import type { AppToastTone } from "./appToastModel.ts";
import type { Locale } from "../localization/messages.ts";

type Tone = Exclude<AppToastTone, "default">;
export type AppToastOptions = { description?: string; duration?: number; locale?: Locale };
export type AppToastMessage = { id: number; tone: Tone; title: string; description?: string; duration: number; open: boolean; locale?: Locale };

// One controlled Tamagui toast; operation IDs prevent late dismissals from
// hiding a newer result notification. Tamagui owns timing, focus and gestures.
export function createAppToastState(defaultDuration: number) {
  let sequence = 0;
  let current: AppToastMessage | null = null;
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach((listener) => listener());
  return {
    getSnapshot: () => current,
    getServerSnapshot: () => null,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    show(tone: Tone, title: string, options?: AppToastOptions) {
      const id = ++sequence;
      current = { id, tone, title, description: options?.description, duration: tone === "loading" ? Infinity : options?.duration ?? defaultDuration, open: true, ...(options?.locale ? { locale: options.locale } : {}) };
      publish();
      return id;
    },
    dismiss(id?: string | number) {
      if (!current || !current.open || id !== undefined && id !== current.id) return;
      current = { ...current, open: false };
      publish();
    },
  };
}
