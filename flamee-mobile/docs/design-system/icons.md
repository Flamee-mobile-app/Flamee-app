# Flamee icons

`assets/icons/manifest.json` is the catalog of reviewed individual SVG sources.
Run `npm run icons:generate` after adding or changing a source; generated files
under `shared/components/icons/generated` are committed and never hand-edited.

Use `FlameeIcon` from `@/shared/components/icons` in application UI. It accepts
a semantic name, `size`, `color`, and accessibility props. Screens never import
raw SVG paths or a vector-icon package directly.

The supplied `579×1968` SVG is an unlabelled artboard, not an icon sprite: it is
not runtime input and cannot be assigned semantic names safely. A new icon must
be exported from Figma as an individual named SVG, reviewed, then added to the
manifest. The currently catalogued sources are the existing, individually named
BottomNav SVG exports.
