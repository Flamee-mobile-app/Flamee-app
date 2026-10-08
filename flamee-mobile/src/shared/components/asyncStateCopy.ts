import type { MessageKey } from "../localization/messages.ts";

export type AsyncStateVariant =
  | "loading"
  | "empty"
  | "error"
  | "offline"
  | "permission"
  | "expired"
  | "success"
  | "pending";

export type AsyncStateCopy = {
  title: MessageKey;
  description: MessageKey;
  actionLabel: MessageKey | null;
};

const copyByVariant: Record<AsyncStateVariant, AsyncStateCopy> = {
  loading: { title: "loadingTitle", description: "loadingDescription", actionLabel: null },
  empty: { title: "emptyTitle", description: "emptyDescription", actionLabel: null },
  error: { title: "errorTitle", description: "errorDescription", actionLabel: "retry" },
  offline: { title: "offlineTitle", description: "offlineDescription", actionLabel: "retry" },
  permission: { title: "permissionTitle", description: "permissionDescription", actionLabel: null },
  expired: { title: "expiredTitle", description: "expiredDescription", actionLabel: "tryAnotherCode" },
  success: { title: "successTitle", description: "successDescription", actionLabel: null },
  pending: { title: "pendingTitle", description: "pendingDescription", actionLabel: "retry" },
};

export function getAsyncStateCopy(variant: AsyncStateVariant): AsyncStateCopy {
  const copy = copyByVariant[variant];
  if (!copy) throw new Error(`Unknown async state variant: ${String(variant)}`);
  return { ...copy };
}
