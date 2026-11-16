/** The highest mounted native modal owns presentation; toast data/timers stay global. */
export function createAppToastHostState() {
  const hosts: string[] = [];
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach((listener) => listener());
  return {
    getSnapshot: () => hosts.at(-1) ?? null,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    register(host: string) {
      hosts.push(host); publish();
      let mounted = true;
      return () => {
        if (!mounted) return;
        mounted = false;
        const index = hosts.lastIndexOf(host);
        if (index >= 0) hosts.splice(index, 1);
        publish();
      };
    },
  };
}
