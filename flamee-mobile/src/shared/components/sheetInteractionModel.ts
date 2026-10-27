export function resolveSheetInteraction(disableDrag: boolean, dismissible: boolean) {
  const pinned = disableDrag || !dismissible;
  return { pinned, nativeScroll: pinned, showHandle: !pinned, dismissOnSnapToBottom: !pinned };
}
