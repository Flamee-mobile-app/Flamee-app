// Product illustrations for stable IDs in the server catalog migration.
// No prices, stock, wallet state or redemption codes are supplied by this module.
const artwork: Record<string, () => number> = {
  "flamee-hair-tie": () => require("./assets/hair-tie.png"),
  "flamee-love-cards": () => require("./assets/cards.png"),
  "flamee-couple-keychains": () => require("./assets/keychains.png"),
  "flamee-couple-mugs": () => require("./assets/mugs.png"),
  "flamee-tote": () => require("./assets/tote.png"),
};
export function rewardArtwork(id: string): number | null {
  return Object.hasOwn(artwork, id) ? artwork[id]() : null;
}
