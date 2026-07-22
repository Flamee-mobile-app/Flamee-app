# Bottom Nav Home Icon States

## Goal

Make the Home tab visually consistent with the three other Bottom Navigation tabs. It must no longer use the orange gradient artwork in the navigation bar.

## Visual behavior

- All four Bottom Navigation icons render in the same white visual system and use the existing 32 px icon slot.
- When Home is inactive, it renders as a white outline icon, matching the weight, apparent size, and alignment of the inactive Activity, Mission, and Profile icons.
- When Home is active, the same Home artwork is rendered as a white filled icon: the area enclosed by its outline is filled, just as the user requested for all active navigation icons.
- The labels and existing active/inactive opacity rules remain unchanged in this focused change.
- The center Flamee logo button, Bottom Nav shape, gradient background, layout, touch targets, and route behavior remain unchanged.

## Asset and component design

- Replace the gradient-only `homeInactive` navigation asset with a Home icon pair designed for the Bottom Nav icon frame.
- Add explicit `homeActive` and `homeInactive` icon variants to `FlameeIcon` rather than inferring their appearance from opacity or route state.
- `BottomNav` selects `homeActive` only on `/home`; it selects `homeInactive` for every other tab.
- The generated icon registry remains the source of truth for SVG assets. Generated files are refreshed with `icons:generate`, not edited by hand.

## Testing and validation

- Add a focused Bottom Nav test that proves the Home variant switches with the active route.
- Retain coverage for the active state of the remaining tabs.
- Run the focused tests, full test suite, icon generation check, lint, TypeScript check, and whitespace-diff check.

## Scope boundary

This change only normalizes the Home tab appearance. Applying filled active artwork to Activity, Mission, and Profile is a follow-up once their corresponding filled SVG variants are supplied or designed.
