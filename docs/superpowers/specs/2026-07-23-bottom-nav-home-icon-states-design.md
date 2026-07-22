# Bottom Nav Home Icon States

## Goal

Use exactly one Home artwork in Bottom Navigation. The SVG path supplied by the user is the canonical Home icon; active and inactive states may change only its fill treatment, never its shape or apparent size.

## Visual behavior

- All four Bottom Navigation icons stay in the existing 32 px slot.
- Home uses the supplied roof, home-outline, and heart paths in both states, with one cropped `6 9 88 77` viewport and `preserveAspectRatio="none"`. This makes its visible footprint fill the same 32 px frame as the three existing navigation icons.
- When Home is active, the canonical paths render filled white.
- When Home is inactive, the same canonical paths render as white strokes with no white fill.
- The active/inactive label and whole-tab opacity rules remain unchanged; the center Flamee badge, Bottom Nav geometry, touch targets, routes, and the non-Home tabs remain unchanged.

## Component design

- Add one hand-authored `HomeNavIcon` component that owns the three canonical SVG paths and accepts `filled: boolean`, `size`, and `color`.
- `FlameeIcon` delegates its existing `home` name to `HomeNavIcon` and passes `filled` through. There are no `homeActive` or `homeInactive` icon names.
- `BottomNav` continues to determine the selected route but always renders `name="home"`; it passes `filled={selected}` only for the Home tab.
- The Home-specific files generated from the prior Figma artwork are removed. The old Figma Home SVG, copied active SVG, manifest entries, generated `HomeIcon`/`HomeActiveIcon`/`HomeInactiveIcon`, and their exports are deleted.

## Testing and validation

- Add a focused Bottom Nav test proving Home renders the single `flamee-icon-home` in both route states and receives the correct `filled` value.
- Keep coverage for the selected state of the remaining tabs.
- Run focused tests, full test suite, lint, TypeScript check, and whitespace-diff check.

## Scope boundary

This change corrects Home only. The active artwork of Activity, Mission, and Profile remains unchanged.
