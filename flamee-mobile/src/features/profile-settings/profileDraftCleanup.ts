// Effect cleanup also runs during development refresh and Strict Mode replay.
// Give the next setup a chance to cancel before deleting the visible draft.
export function createProfileDraftCleanup(cleanup: (uri: string) => Promise<void>) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  return {
    cancel,
    schedule(uri: string) {
      cancel();
      timer = setTimeout(() => {
        timer = null;
        void cleanup(uri);
      }, 0);
    },
  };
}
