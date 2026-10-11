import { useSyncExternalStore } from "react";
import { inviteCodeSchema } from "./schemas";

let code: string | null = null;
let revision = 0;
const listeners = new Set<() => void>();
const publish = () => { revision += 1; listeners.forEach((listener) => listener()); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

// Invitation credentials stay in feature memory, never internal route params.
export const inviteIntent = {
  getCode: () => code,
  setCode(input: string) {
    const parsed = inviteCodeSchema.safeParse({ code: input });
    if (!parsed.success) return false;
    code = parsed.data.code;
    publish();
    return true;
  },
  clear() { code = null; publish(); },
};

export function useInviteIntentRevision() {
  return useSyncExternalStore(subscribe, () => revision, () => 0);
}

export const invitationURL = (inviteCode: string) => `flamee://connect/${inviteCodeSchema.parse({ code: inviteCode }).code}`;
