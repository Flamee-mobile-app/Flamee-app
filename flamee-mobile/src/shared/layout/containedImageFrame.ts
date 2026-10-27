/** Fit the entire image within both bounds without crop or a tall intrinsic frame. */
export function getContainedImageFrame(imageWidth: number | null | undefined, imageHeight: number | null | undefined, availableWidth: number, maxHeight: number) {
  const valid = Number.isFinite(imageWidth) && Number.isFinite(imageHeight) && Number(imageWidth) > 0 && Number(imageHeight) > 0;
  const ratio = valid ? Number(imageWidth) / Number(imageHeight) : 1;
  const width = Math.max(0, Math.min(Number.isFinite(availableWidth) ? availableWidth : 0, Math.max(0, Number.isFinite(maxHeight) ? maxHeight : 0) * ratio));
  return { width, height: width / ratio };
}
