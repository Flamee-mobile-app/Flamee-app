/** End visible access before waiting for native credential removal. Its failure still reaches the caller. */
export async function performLocalSignOut<T>(actions: {
  signOut: () => Promise<T>;
  clearInvite: () => void;
  clearQueries: () => void;
  replaceAuth: () => void;
  clearNative: () => Promise<void>;
}): Promise<T> {
  const removal = actions.signOut();
  actions.clearInvite();
  actions.clearQueries();
  actions.replaceAuth();
  void actions.clearNative().catch(() => undefined);
  return removal;
}
