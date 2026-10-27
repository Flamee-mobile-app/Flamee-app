export function shouldShowInitialSkeleton({ pending, hasConfirmedContent }: { pending: boolean; hasConfirmedContent: boolean }) {
  return pending && !hasConfirmedContent;
}

export function shouldShowImageSkeleton({ loaded, hasPreview }: { loaded: boolean; hasPreview: boolean }) {
  return !loaded && !hasPreview;
}
