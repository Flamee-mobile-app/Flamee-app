export async function settleBeforeStartupDeadline<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const fallback = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  try {
    return await Promise.race([operation, fallback]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
