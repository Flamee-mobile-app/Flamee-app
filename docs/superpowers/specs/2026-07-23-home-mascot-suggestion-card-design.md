# Home Mascot Suggestion Card Design

## Goal

Refine the redesigned Home screen by removing the redundant `FLAMEE HÔM NAY` eyebrow and replacing the oversized Mood check-in card with a more purposeful interaction prompt from Flamee.

## Approved experience

- `HomeWelcomeHeader` shows only the time-aware greeting and its supporting quote. The removed eyebrow does not leave an empty label or preserve its former spacing.
- A full-width `Flamee gợi ý` card appears below `Khám phá cùng nhau` and above the normal function grid.
- The card reuses the existing static happy Flamee mascot sticker; it does not create a new image, Rive animation, mascot state, or duplicate the tappable floating Home mascot.
- Its content is fixed for this phase:
  - tag: `FLAMEE GỢI Ý`;
  - title: `Hỏi nhau một điều nhỏ nhé`;
  - prompt: `Hôm nay điều gì làm bạn mỉm cười?`;
  - action: `Cùng chia sẻ`.
- Pressing the suggestion action uses `router.push(ROUTES.ai)`, matching the existing detail-navigation semantics of Chat AI.
- `Mood check-in` remains visible and reachable but becomes a regular small bento item. All six functions therefore form three balanced two-column rows after the suggestion card.

## Visual hierarchy

- The suggestion card uses the established cream surface, coral text, 22 px rounded corners and a compact mascot illustration at its trailing edge. It should feel like a friendly invitation, not a stretched shortcut button.
- The text stack occupies the leading side: small tag, prominent one-line prompt title, then the question. The arrow/action sits with the text rather than competing with the mascot image.
- Regular function cards keep the existing warm glass treatment, white copy and active press treatment. No Bottom Nav, background, Home mascot overlay, route guard, or destination screen changes.

## Motion and accessibility

- The suggestion card follows the existing bento entrance sequence, appearing before the six function cards. It immediately renders in its final state when reduced motion is enabled or the welcome was already consumed this session.
- The entire suggestion card is one accessible button named `Flamee gợi ý: Hỏi nhau một điều nhỏ nhé`; its action is unambiguous and does not expose a separate inaccessible decorative mascot control.

## Tests

- Extend the welcome-header test to verify the eyebrow is absent.
- Extend bento tests to verify the suggestion card is present, calls `onNavigate(ROUTES.ai, 'push')`, and that Mood check-in continues to call `replace`.
- Retain the existing Home composition and navigation coverage, then run focused Home tests, full Jest, lint and TypeScript checks.

## Scope boundary

This is a Home visual-hierarchy refinement only. It does not change data sources, mascot message behaviour, fake authentication, floating Bottom Nav geometry, or route protection.
