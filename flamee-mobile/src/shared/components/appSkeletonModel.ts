export function shouldShowInitialSkeleton({ pending, hasConfirmedContent }: { pending: boolean; hasConfirmedContent: boolean }) {
  return pending && !hasConfirmedContent;
}

export function shouldShowImageSkeleton({ loaded, previewLoaded }: { loaded: boolean; previewLoaded: boolean }) {
  return !loaded && !previewLoaded;
}
