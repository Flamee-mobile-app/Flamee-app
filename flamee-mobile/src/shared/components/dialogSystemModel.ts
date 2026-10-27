export type DialogSurfaceTone = "glass" | "solid" | "paper";

export function getDialogSurfacePresentation(tone: DialogSurfaceTone) {
  return tone !== "glass" ? {
    backgroundColor: tone === "paper" ? "$surface" as const : "$white" as const,
    backdropFilter: "none" as const,
    backgroundImage: "none" as const,
    boxShadow: "none" as const,
  } : {};
}
