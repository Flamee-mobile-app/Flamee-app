# Flamee Mobile — UI, navigation flow, and Home redesign requirements

**Status:** Issue 1 implemented and verified automatically; Issue 2 is the active workstream.  
**Date recorded:** 2026-07-22

## Product context

The current mobile client is largely composed of Figma-like frames linked through routes. This makes individual screens look close to the design, but the application does not yet behave as one coherent mobile app: some UI states are static/hard-coded and horizontal gestures can traverse route history unexpectedly.

This document consolidates the three issues requested so implementation can address them together without losing their interaction and visual context.

## Issue 1 — Mascot message interaction and unsafe gesture navigation

### Implementation status — completed 2026-07-22

- Introduced one shared mascot-message motion implementation for Home and Dating Schedule: 200ms fade, scale and vertical movement, with a reduced-motion fallback.
- Preserved the existing visual design and Home actions (`Mood check`, `Chat AI`). Home can dismiss an open message by tapping outside it.
- On Dating Schedule, the existing `×` remains visually unchanged but now has a 44×44 touch target. Both that control and outside-screen taps dismiss only the message; only the dedicated message action opens Chat AI.
- Preserved the Dating Schedule collapsed mascot badge anchor exactly as it was in the approved visual.
- Added Android runtime back protection for the five persistent main destinations (Home, Activities/Timeline, Mood, Missions and Profile), in addition to the native-stack gesture configuration. Detail pages continue to use normal back navigation.
- Added automated coverage for mascot dismissal isolation, motion behavior, the close hit target, Android back-event consumption and guard cleanup when moving to a detail page.
- Verification: 29/29 Jest suites and 109/109 tests pass; Expo lint and configured TypeScript checking pass.

Manual Android acceptance verification remains pending because no emulator or ADB-connected device was available. Full authentication-based history isolation remains part of Issue 2.

### 1.1 Mascot message behaviour

#### Current context

- The Home screen has a mascot that can reveal a message.
- The Dating Schedule (`Lịch hẹn hò`) screen also has a mascot and a message/suggestion bubble, including a visible `×` close control.

#### Required behaviour

- The interaction and motion used when tapping the **Home mascot** to reveal its message must be visually and behaviourally consistent with the mascot interaction on the **Dating Schedule** screen.
- When the mascot message is open on the Dating Schedule screen, users must be able to close it in both of these ways:
  1. Tap the visible `×` close button on the message.
  2. Tap elsewhere in the screen, outside the message/mascot interaction area.
- The expected result is a deliberate, predictable expanded/collapsed message state rather than a static Figma-frame element.

### 1.2 Critical mobile navigation issue

#### Problem observed

On mobile, horizontal swiping can move through the application’s route history instead of remaining within the intended app flow. Specifically around the Home screen:

1. Swiping left causes an unintended return to the Home screen.
2. Swiping left again can navigate backwards to the Login screen.

The provided visual evidence shows the Home screen sliding as separate frames, reinforcing that navigation is being treated as route/frame history rather than a stable app shell.

#### Required outcome

- A horizontal swipe must not accidentally expose prior frame routes or take a logged-in user back to Login.
- The main experience must behave as a single mobile application, not as individual Figma frames connected by routes.
- Gesture handling and route history must be reviewed together with the authentication protection in Issue 2.

### Acceptance criteria

- [x] Home mascot message uses the same coherent interaction/motion language as the Dating Schedule mascot.
- [x] On Dating Schedule, an open mascot message closes with either `×` or an outside-screen tap.
- [~] The main/Home shell now consumes Android system back at persistent destinations and disables native-stack gestures. Preventing access to Login through session-aware route history is completed with Issue 2 protected routing.

## Issue 2 — Complete login flow, protected routes, and functional floating bottom navigation

### 2.1 Fake authentication until backend integration

#### Current context

There is no backend authentication integration required for this phase.

#### Required behaviour

- Users can create and sign in with a fake/local account.
- A fake session is persisted after successful sign-in so a user remains logged in when returning to the app.
- Authentication state controls entry into the main app instead of relying on independently accessible screens.
- The fake-auth approach must be structured so it can later be replaced by real backend authentication without redesigning the whole navigation flow.

### 2.2 Protected routes and auth-history isolation

#### Required behaviour

- Main-app routes require a valid fake session.
- Once authenticated, Login (and the previous auth-route history) must not become reachable through a back action or a horizontal swipe.
- The app must redirect appropriately based on session state:
  - no valid session → authentication flow;
  - valid session → main application flow.
- This protection is part of the fix for the navigation failure in Issue 1; simply styling the screens is insufficient.

### 2.3 Floating bottom navigation

#### Current context

The current bottom navigation visually resembles the Figma frame but behaves as a static/hard-coded element. In particular, the Home icon is rendered as active regardless of the current route.

#### Required behaviour

- Convert the bottom navigation into a modern **floating** mobile bottom nav that remains attached to the screen/main app shell while navigating between primary sections.
- Preserve the established Flamee visual design (warm orange palette, curved central mascot/flame area, existing iconography/layout) rather than replacing it with a different generic nav.
- Each tab/button must navigate to its correct primary section.
- Active/inactive styling must be driven by the actual current route/state, never hard-coded to the Home tab.
- The primary labels shown in the current design are:
  - `Trang chủ` (Home)
  - `Hoạt động` (Activities)
  - `Nhiệm vụ` (Missions)
  - `Hồ sơ` (Profile)

### Acceptance criteria

- A newly created local account can sign in and its fake session survives app re-entry.
- Authenticated users enter the main app directly and cannot reach Login by swipe/back-history behaviour.
- Unauthenticated users cannot access main routes.
- Bottom nav stays visible as the intended floating app-shell control across its primary screens.
- Exactly the current primary destination has active styling; every other tab is inactive.
- The existing Flamee bottom-nav visual identity is retained.

## Issue 3 — Rebuild and redesign the Home screen

### Current context

The existing Home screen is a hard-coded Figma-frame recreation: greeting, feature buttons, notification card, mascot, and bottom nav are arranged as static fixed elements. It needs to be rebuilt as responsive, stateful app UI while retaining the supplied background image and Flamee identity.

### Required structure and experience

#### 3.1 Retained visual foundation

- Keep the current image as the Home screen background.
- Retain the warm, orange Flamee visual identity.
- Integrate with the functional floating bottom nav from Issue 2, rather than treating the nav as part of a static screen image/frame.

#### 3.2 First-entry greeting

- On the first load/entry to the app’s Home screen, display a time-aware greeting (for example, `Chào buổi sáng` or `Chào buổi tối`).
- The greeting text must use a transition/entrance animation.
- Display a supporting quote alongside or immediately after the greeting.
- This should feel like a purposeful welcome moment, not a permanently fixed headline.

#### 3.3 Feature overview after the greeting

- After the welcome introduction, present a clear overview of the app’s available functions.
- Use a bento-style layout to make the functions easy to scan, visually attractive, and pleasant to use on a mobile screen.
- The overview must still show all important functions; a redesign must not hide app capabilities for aesthetic reasons.
- The Home information architecture and layout should be chosen for the best user experience, rather than copied directly from Figma coordinates.

### Design constraints

- Do not discard the supplied background image.
- Do not make the redesigned Home screen another static set of Figma frames.
- Preserve overall Flamee branding and make the greeting, feature overview, mascot message, and floating nav feel like one coordinated mobile interface.
- The Home mascot/message interaction must also satisfy Issue 1.

### Acceptance criteria

- The Home entry renders an animated, time-aware greeting and quote on first load.
- The original background image remains the visual base of the screen.
- Users can understand and access every major Flamee function from the Home overview.
- The feature overview is implemented as a mobile-friendly bento layout rather than hard-coded frame coordinates.
- Home works as part of the protected, floating-nav main app shell.

## Cross-issue definition of done

All three issues are complete only when the following holds together in one mobile flow:

1. A user creates/signs into a local fake account and their session persists.
2. The user lands in a protected main-app shell, cannot swipe/back into Login, and does not see isolated Figma frames slide through history.
3. The floating bottom nav correctly reflects the current destination and preserves Flamee’s existing visual language.
4. Home provides an animated time-based greeting and quote, followed by a responsive bento overview over the existing background image.
5. Mascot message states are coordinated between Home and Dating Schedule; on Dating Schedule, the message dismisses via `×` or outside tap.

## Deliberately not specified yet

- Exact fake-account fields, validation rules, and storage technology.
- Exact greeting copy, quote set, transition duration/easing, and bento card ordering.
- Exact visual tokens for active/inactive navigation states beyond preserving the existing Flamee design language.

These details should be decided during implementation after inspecting the existing component and route structure, without changing the requirements above.
