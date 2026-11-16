import { useCallback, useEffect, useRef, useState } from "react";
import type { ViewToken } from "react-native";
import { prefetchRemoteImage } from "../../shared/media/imagePrefetch";
import type { MemorySummary } from "../moments";
import { createImagePrefetchQueue, selectFeedPrefetchUrls } from "./feedImagePrefetch";

export function useFeedImagePrefetch(feed: readonly MemorySummary[], active: boolean) {
  const [range, setRange] = useState({ first: 0, last: 1 });
  const queue = useRef<ReturnType<typeof createImagePrefetchQueue> | null>(null);
  useEffect(() => {
    const current = createImagePrefetchQueue(prefetchRemoteImage);
    queue.current = current;
    return () => { current.dispose(); if (queue.current === current) queue.current = null; };
  }, []);
  useEffect(() => { queue.current?.setActive(active); }, [active]);
  useEffect(() => { if (active) queue.current?.enqueue(selectFeedPrefetchUrls(feed, range.first, range.last)); }, [feed, range, active]);
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<MemorySummary>[] }) => {
    const indexes = viewableItems.map((item) => item.index).filter((index): index is number => index !== null);
    if (!indexes.length) return;
    const first = Math.min(...indexes), last = Math.max(...indexes);
    setRange((previous) => previous.first === first && previous.last === last ? previous : { first, last });
  }, []);
  return { range, onViewableItemsChanged };
}
