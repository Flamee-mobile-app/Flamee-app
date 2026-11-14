export type DialogSurfaceTone = "glass" | "solid" | "paper";

export function getDialogSurfacePresentation(_tone: DialogSurfaceTone) {
  // Keep legacy tone props compatible; all popups now use opaque white.
  return {
    backgroundColor: "$white" as const,
    backdropFilter: "none" as const,
    backgroundImage: "none" as const,
    boxShadow: "none" as const,
  };
}
