import type { MascotStickerDefinition } from "./types.ts";

export const mascotStickerCatalog = [
  { id: "mascot-excited", labelKey: "mascotExcited", source: () => require("../../public/mascot-sticker/image(1).png") },
  { id: "mascot-loved", labelKey: "mascotLoved", source: () => require("../../public/mascot-sticker/image(3).png") },
  { id: "mascot-calm", labelKey: "mascotCalm", source: () => require("../../public/mascot-sticker/image(5).png") },
  { id: "mascot-overwhelmed", labelKey: "mascotOverwhelmed", source: () => require("../../public/mascot-sticker/image(6).png") },
  { id: "mascot-neutral", labelKey: "mascotNeutral", source: () => require("../../public/mascot-sticker/image(7).png") },
  { id: "mascot-angry", labelKey: "mascotAngry", source: () => require("../../public/mascot-sticker/image(8).png") },
  { id: "mascot-tired", labelKey: "mascotTired", source: () => require("../../public/mascot-sticker/image(9).png") },
  { id: "mascot-shy", labelKey: "mascotShy", source: () => require("../../public/mascot-sticker/image(10).png") },
  { id: "mascot-sad", labelKey: "mascotSad", source: () => require("../../public/mascot-sticker/image(20261014-045629).png") },
] as const satisfies readonly MascotStickerDefinition[];

export function resolveMascotSticker(id: string | null | undefined): MascotStickerDefinition | null {
  if (!id) return null;
  return mascotStickerCatalog.find((sticker) => sticker.id === id) ?? null;
}
