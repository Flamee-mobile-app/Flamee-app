export type ProfileSaveOperation = { accountId: string };

export function createProfileSaveLifecycle() {
  let accountId: string | null = null;
  let retained = false;
  let pending: ProfileSaveOperation | null = null;
  return {
    retain(owner: string | null) {
      if (accountId !== owner) pending = null;
      accountId = owner;
      retained = true;
    },
    release() { retained = false; },
    isSaving: () => pending !== null,
    begin(owner: string): ProfileSaveOperation | null {
      if (!retained || pending || owner !== accountId) return null;
      pending = { accountId: owner };
      return pending;
    },
    canApply: (operation: ProfileSaveOperation, activeAccount: string | null) => retained && pending === operation && accountId === operation.accountId && activeAccount === operation.accountId,
    settle(operation: ProfileSaveOperation, activeAccount: string | null) {
      const cleanup = !retained || pending !== operation || accountId !== operation.accountId || activeAccount !== operation.accountId;
      if (pending === operation) pending = null;
      return { render: retained, saving: pending !== null, cleanup };
    },
  };
}
