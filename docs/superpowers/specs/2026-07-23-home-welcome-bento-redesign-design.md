# Home Welcome Bento Redesign

## Goal

Replace the hard-coded Figma-frame Home layout with a responsive mobile Home experience that retains Flamee's current background, mascot interaction, and floating Bottom Nav.

## Welcome behavior

- The first time Home renders after an app launch or fake-session restoration, it shows a Vietnamese time-aware greeting and a supporting relationship quote.
- The greeting enters with a short fade and upward movement; the quote follows, then the bento cards enter with a small stagger.
- This welcome animation runs once per in-memory app session. Navigating away from Home and returning in the same session shows the complete Home content immediately without replaying it.
- The greeting is determined from the device's local hour: morning, noon, afternoon, or evening. The quote is deterministic for the session so it does not change during navigation.
- A reduced-motion preference renders the final states without movement while keeping all content available.

## Layout and visual system

- Keep `brandAssets.background` as the full-screen background and use a readable dark/warm overlay.
- Preserve the existing Flamee header and header Chat AI shortcut, Home mascot/message behavior, and floating Bottom Nav shell.
- Replace fixed `Dimensions`-based coordinates with a scrollable content container and responsive card widths derived from live layout measurements.
- The bento area presents every major function as a visible touch target:
  1. a large primary Mood check-in card;
  2. Chat AI;
  3. Dòng thời gian;
  4. Lịch hẹn hò;
  5. Sổ kỉ niệm;
  6. Nhiệm vụ.
- Bento cards use Flamee's translucent warm glass surface, rounded corners, white copy, and existing Ionicons. The primary Mood card is larger; the other five cards form balanced two-column rows on normal phone widths.
- Scroll content reserves bottom space for the persistent floating Bottom Nav and the Home mascot anchor. No card is positioned with frame-specific pixel coordinates.

## Routing and interaction

- Mood, Timeline, Missions, and Profile-style main destinations use route replacement as they do today.
- Chat AI, Dates, and Memory Book use detail navigation and retain normal back behavior.
- The floating Bottom Nav remains responsible for primary route selection; Home must not reproduce it as a screen-local static element.

## Component boundaries

- `homeWelcomeContent.ts` owns pure time-based greeting and quote selection.
- `useHomeWelcome` owns the one-per-session flag and entrance animation values.
- `HomeWelcomeHeader` renders greeting/quote presentation only.
- `HomeBentoGrid` renders the six responsive route cards only.
- `HomeScreen` composes these pieces with the existing background, header, mascot, and scroll safe area.

## Testing and validation

- Unit-test time buckets and deterministic quote selection.
- Test the welcome state is consumed once per session and reduced motion skips movement.
- Test all six bento shortcuts are present and navigate to their intended routes.
- Retain Home mascot coverage and run focused Home, full Jest, lint, TypeScript, and whitespace-diff checks.

## Scope boundary

This work redesigns Home only. It does not change fake authentication, Bottom Nav geometry, mascot behavior, or visual layouts of the destination screens.
