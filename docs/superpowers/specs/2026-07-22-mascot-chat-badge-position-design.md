# Mascot chat badge placement

## Goal

Move the collapsed chat badge in `MascotSuggestBubble` to overlap the mascot's upper-left corner.

## Design

- Keep the mascot at its existing floating bottom-right anchor.
- Position only the collapsed chat badge absolutely within the mascot container, so its location is independent of the badge width.
- Place the badge slightly above and to the left of the 64 px mascot, with its tail still pointing toward the mascot.
- Preserve the existing expanded speech card, animation, haptic feedback, icon, visual treatment, and press handlers.

## Scope

The change is limited to `flamee-mobile/features/dates/components/MascotSuggestBubble.tsx` and its component test. No other mascot placement or navigation behavior changes.

## Validation

- Add a rendered-component test that verifies the collapsed chat badge uses the upper-left anchor style.
- Run that focused test, then the app lint command.
