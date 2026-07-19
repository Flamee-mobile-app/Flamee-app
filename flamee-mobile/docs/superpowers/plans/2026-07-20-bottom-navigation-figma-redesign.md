# Figma Bottom Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Render the shared Expo Router bottom navigation with the approved Flamee Figma design while keeping the center logo decorative and route visibility unchanged.

**Architecture:** Navigation metadata owns two independent concerns: five route paths on which the nav may mount and four Figma tabs that can receive presses. BottomNav renders the four tabs with locally committed Figma SVG assets through expo-image, while the existing layout keeps using isMainNavigationPath without router changes.

**Tech Stack:** Expo Router 6, React Native 0.81, TypeScript, expo-image, expo-linear-gradient, react-native-safe-area-context, Jest Expo, React Native Testing Library.

## Global Constraints

- Keep app/(main) as an Expo Router Stack; do not add routes or Expo Tabs.
- Render nav only on home, memories, mood, missions, and profile; hide it on ai, dates, and timeline.
- The center Flamee logo is decorative: it has no press handler, route, tab role, or accessibility label.
- Download the exact Figma SVG exports from node 6528:8281 and commit them under assets/navigation.
- Reuse assets/flamee_logo.png for the center mark because it visibly matches the Figma logo glyph.
- Preserve unrelated dirty-worktree changes and stage only the files listed by each commit.

---

## File structure

- lib/navigation/routes.ts: five display paths, four interactive tab records, pathname predicate.
- lib/navigation/routes.test.ts: display visibility and Mood exclusion from tab metadata.
- assets/navigation/*.svg: immutable Figma bar and icon exports.
- components/ui/BottomNav.tsx: responsive nav rendering and accessibility.
- components/ui/BottomNav.test.tsx: four-tab rendering and route replacement behavior.

## Task 1: Separate display paths from Figma tabs

**Files:**
- Modify: lib/navigation/routes.ts
- Modify: lib/navigation/routes.test.ts

**Interfaces:**
- Consumes: existing ROUTES entries, each typed as Expo Router Href.
- Produces: MAIN_NAV_PATHS, BOTTOM_NAV_ITEMS, BottomNavItem, and isMainNavigationPath(pathname: string).

- [ ] **Step 1: Write the failing metadata test**

Replace lib/navigation/routes.test.ts with:

~~~ts
import { BOTTOM_NAV_ITEMS, isMainNavigationPath } from './routes';

describe('isMainNavigationPath', () => {
  test.each(['/home', '/memories', '/mood', '/missions', '/profile'])(
    'shows the bottom navigation on %s',
    (pathname) => {
      expect(isMainNavigationPath(pathname)).toBe(true);
    },
  );

  test.each(['/ai', '/dates', '/timeline', '/login'])(
    'hides the bottom navigation on %s',
    (pathname) => {
      expect(isMainNavigationPath(pathname)).toBe(false);
    },
  );
});

describe('BOTTOM_NAV_ITEMS', () => {
  it('contains the four interactive tabs from Figma and excludes Mood', () => {
    expect(BOTTOM_NAV_ITEMS.map((item) => item.key)).toEqual([
      'home',
      'memories',
      'missions',
      'profile',
    ]);
    expect(BOTTOM_NAV_ITEMS.map((item) => item.label)).toEqual([
      'Trang chủ',
      'Hoạt động',
      'Nhiệm vụ',
      'Hồ sơ',
    ]);
    expect(BOTTOM_NAV_ITEMS).toHaveLength(4);
  });
});
~~~

- [ ] **Step 2: Verify the test fails for the intended reason**

Run:

~~~powershell
npx jest lib/navigation/routes.test.ts --runInBand --config '{"preset":"jest-expo"}'
~~~

Expected: FAIL because BOTTOM_NAV_ITEMS is not exported.

- [ ] **Step 3: Implement the smallest route metadata change**

Replace the navigation type and exports below ROUTES in lib/navigation/routes.ts with:

~~~ts
export type FlameeRouteKey = keyof typeof ROUTES;

export type BottomNavItem = {
  key: Extract<FlameeRouteKey, 'home' | 'memories' | 'missions' | 'profile'>;
  label: string;
  href: Href;
};

export const MAIN_NAV_PATHS = [
  ROUTES.home,
  ROUTES.memories,
  ROUTES.mood,
  ROUTES.missions,
  ROUTES.profile,
] as const;

export const BOTTOM_NAV_ITEMS = [
  { key: 'home', label: 'Trang chủ', href: ROUTES.home },
  { key: 'memories', label: 'Hoạt động', href: ROUTES.memories },
  { key: 'missions', label: 'Nhiệm vụ', href: ROUTES.missions },
  { key: 'profile', label: 'Hồ sơ', href: ROUTES.profile },
] as const satisfies readonly BottomNavItem[];

export function isMainNavigationPath(pathname: string) {
  return MAIN_NAV_PATHS.some((href) => String(href).replace('/(main)', '') === pathname);
}
~~~

Keep ROUTES unchanged. Do not retain MAIN_NAV_ITEMS because it encodes the rejected assumption that Mood is a tab.

- [ ] **Step 4: Verify the route test is green**

~~~powershell
npx jest lib/navigation/routes.test.ts --runInBand --config '{"preset":"jest-expo"}'
~~~

Expected: PASS with 10 tests.

- [ ] **Step 5: Commit only the metadata deliverable**

~~~powershell
git add -- lib/navigation/routes.ts lib/navigation/routes.test.ts
git commit -m "refactor: separate bottom navigation paths and tabs"
~~~

## Task 2: Render the four-tab Figma navigation

**Files:**
- Create: assets/navigation/bottom-nav-union.svg
- Create: assets/navigation/bottom-nav-home.svg
- Create: assets/navigation/bottom-nav-activities.svg
- Create: assets/navigation/bottom-nav-missions-star-one.svg
- Create: assets/navigation/bottom-nav-missions-star-two.svg
- Create: assets/navigation/bottom-nav-profile-head.svg
- Create: assets/navigation/bottom-nav-profile-body.svg
- Create: components/ui/BottomNav.test.tsx
- Modify: components/ui/BottomNav.tsx

**Interfaces:**
- Consumes: BOTTOM_NAV_ITEMS and BottomNavItem, local SVG assets, Expo Router pathname/router APIs, and safe-area insets.
- Produces: a BottomNav exposing exactly four tab roles and invoking router.replace(item.href) when pressed.

- [ ] **Step 1: Write the failing component test**

Create components/ui/BottomNav.test.tsx:

~~~tsx
import { fireEvent, render } from '@testing-library/react-native';

import { ROUTES } from '@/lib/navigation/routes';

import { BottomNav } from './BottomNav';

const mockReplace = jest.fn();
let mockPathname = '/home';

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));

describe('BottomNav', () => {
  beforeEach(() => {
    mockPathname = '/home';
    mockReplace.mockClear();
  });

  it('renders only the four interactive tabs defined by Figma', () => {
    const { getAllByRole, queryByRole } = render(<BottomNav />);

    expect(getAllByRole('tab')).toHaveLength(4);
    expect(queryByRole('tab', { name: 'Mood' })).toBeNull();
    expect(queryByRole('tab', { name: 'Trang chủ' })).not.toBeNull();
    expect(queryByRole('tab', { name: 'Hoạt động' })).not.toBeNull();
    expect(queryByRole('tab', { name: 'Nhiệm vụ' })).not.toBeNull();
    expect(queryByRole('tab', { name: 'Hồ sơ' })).not.toBeNull();
  });

  it('replaces the route when the Hồ sơ tab is pressed', () => {
    const { getByRole } = render(<BottomNav />);

    fireEvent.press(getByRole('tab', { name: 'Hồ sơ' }));

    expect(mockReplace).toHaveBeenCalledWith(ROUTES.profile);
  });
});
~~~

- [ ] **Step 2: Verify the component test fails for the existing five-tab UI**

~~~powershell
npx jest components/ui/BottomNav.test.tsx --runInBand --config '{"preset":"jest-expo"}'
~~~

Expected: FAIL because the existing component renders five tabs and does not expose the Figma labels.

- [ ] **Step 3: Download and retain the exact Figma SVG exports**

Run from the repository root. These are original Figma export bytes; do not edit their SVG path data.

~~~powershell
$figmaAssets = @{
  'bottom-nav-union.svg' = 'https://www.figma.com/api/mcp/asset/975881c9-edd2-408c-bdd4-572d67a1a848'
  'bottom-nav-home.svg' = 'https://www.figma.com/api/mcp/asset/06b3cab8-2806-4380-92fc-11296656482a'
  'bottom-nav-activities.svg' = 'https://www.figma.com/api/mcp/asset/c5566af6-9594-45ba-b089-f61ae882a9c9'
  'bottom-nav-missions-star-one.svg' = 'https://www.figma.com/api/mcp/asset/1162b7df-c8f0-4ab8-8085-a8739a98c569'
  'bottom-nav-missions-star-two.svg' = 'https://www.figma.com/api/mcp/asset/4e4a517e-6357-4948-85a1-5e2c923b0d92'
  'bottom-nav-profile-head.svg' = 'https://www.figma.com/api/mcp/asset/79c4aec5-033a-406c-8593-d0deadf66bb5'
  'bottom-nav-profile-body.svg' = 'https://www.figma.com/api/mcp/asset/5d7e71b1-376e-4d5f-986f-5cde0b432d01'
}

New-Item -ItemType Directory -Force 'assets/navigation' | Out-Null
foreach ($asset in $figmaAssets.GetEnumerator()) {
  curl.exe --fail --location --output "assets/navigation/$($asset.Key)" $asset.Value
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Get-ChildItem 'assets/navigation/*.svg' | Select-Object Name, Length
~~~

Expected: seven non-empty SVG files. expo-image already supports bundled SVGs on Android, iOS, and web, so do not add an SVG transformer or dependency.

- [ ] **Step 4: Replace BottomNav with the Figma-based implementation**

Replace components/ui/BottomNav.tsx with:

~~~tsx
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { flameeTheme } from '@/constants/flameeTheme';
import { BOTTOM_NAV_ITEMS, type BottomNavItem } from '@/lib/navigation/routes';

import { AppText } from './AppText';

const navBackground = require('../../assets/navigation/bottom-nav-union.svg');
const homeIcon = require('../../assets/navigation/bottom-nav-home.svg');
const activitiesIcon = require('../../assets/navigation/bottom-nav-activities.svg');
const missionStarOne = require('../../assets/navigation/bottom-nav-missions-star-one.svg');
const missionStarTwo = require('../../assets/navigation/bottom-nav-missions-star-two.svg');
const profileHead = require('../../assets/navigation/bottom-nav-profile-head.svg');
const profileBody = require('../../assets/navigation/bottom-nav-profile-body.svg');
const flameeLogo = require('../../assets/flamee_logo.png');

const TAB_LAYOUT: Record<BottomNavItem['key'], { left: string; top: number }> = {
  home: { left: '4.85%', top: 15 },
  memories: { left: '24.38%', top: 15 },
  missions: { left: '59.08%', top: 12 },
  profile: { left: '76.12%', top: 12 },
};

function BottomNavIcon({ itemKey }: { itemKey: BottomNavItem['key'] }) {
  if (itemKey === 'home') {
    return <Image source={homeIcon} contentFit="contain" style={styles.homeIcon} />;
  }

  if (itemKey === 'memories') {
    return <Image source={activitiesIcon} contentFit="contain" style={styles.activitiesIcon} />;
  }

  if (itemKey === 'missions') {
    return (
      <>
        <Image source={missionStarOne} contentFit="contain" style={styles.missionStarOne} />
        <Image source={missionStarTwo} contentFit="contain" style={styles.missionStarTwo} />
      </>
    );
  }

  return (
    <>
      <Image source={profileHead} contentFit="contain" style={styles.profileHead} />
      <Image source={profileBody} contentFit="contain" style={styles.profileBody} />
    </>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.bar}>
        <Image
          accessible={false}
          pointerEvents="none"
          source={navBackground}
          contentFit="fill"
          style={styles.background}
        />

        <View style={styles.tabs}>
          {BOTTOM_NAV_ITEMS.map((item) => {
            const selected = String(item.href).replace('/(main)', '') === pathname;

            return (
              <Pressable
                key={item.key}
                accessibilityLabel={item.label}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => router.replace(item.href)}
                style={({ pressed }) => [
                  styles.tab,
                  TAB_LAYOUT[item.key],
                  pressed && styles.tabPressed,
                ]}>
                <View style={styles.iconBox}>
                  <BottomNavIcon itemKey={item.key} />
                </View>
                <AppText
                  variant="micro"
                  color={flameeTheme.colors.text.inverse}
                  align="center"
                  numberOfLines={1}
                  style={styles.label}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <LinearGradient
          accessible={false}
          pointerEvents="none"
          colors={flameeTheme.gradients.brandDiag}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBadge}>
          <Image accessible={false} source={flameeLogo} contentFit="contain" style={styles.logo} />
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activitiesIcon: { bottom: '10.95%', left: '12%', position: 'absolute', right: '12%', top: '18%' },
  background: { bottom: 0, height: 72, left: 0, position: 'absolute', right: 0 },
  bar: {
    height: 72,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  container: { bottom: 0, left: 0, position: 'absolute', right: 0 },
  homeIcon: { bottom: '15%', left: '7%', position: 'absolute', right: '7%', top: '9.34%' },
  iconBox: { height: 32, position: 'relative', width: 32 },
  label: { fontWeight: '400', lineHeight: 10, marginTop: 0 },
  logo: { height: 42, width: 36 },
  logoBadge: {
    alignItems: 'center',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -28,
    position: 'absolute',
    top: -28,
    width: 56,
    zIndex: 2,
  },
  missionStarOne: {
    bottom: '10.17%',
    left: '10.34%',
    position: 'absolute',
    right: '25.34%',
    top: '15.17%',
  },
  missionStarTwo: {
    bottom: '58.81%',
    left: '58.71%',
    position: 'absolute',
    right: '14.71%',
    top: '11.81%',
  },
  profileBody: {
    bottom: '14.96%',
    left: '18%',
    position: 'absolute',
    right: '18%',
    top: '58.43%',
  },
  profileHead: {
    bottom: '50%',
    left: '30%',
    position: 'absolute',
    right: '30%',
    top: '10%',
  },
  tab: { alignItems: 'center', position: 'absolute', width: 64 },
  tabPressed: { opacity: 0.75 },
  tabs: { height: 72, position: 'relative' },
});
~~~

Do not modify app/(main)/_layout.tsx. It already calls isMainNavigationPath exactly once, so Task 1 preserves the approved five-route mount behavior.

- [ ] **Step 5: Verify the component test is green**

~~~powershell
npx jest components/ui/BottomNav.test.tsx --runInBand --config '{"preset":"jest-expo"}'
~~~

Expected: PASS with 2 tests.

- [ ] **Step 6: Commit only the Figma UI deliverable**

~~~powershell
git add -- assets/navigation components/ui/BottomNav.tsx components/ui/BottomNav.test.tsx
git commit -m "feat: match bottom navigation to Figma"
~~~

## Task 3: Verify route behavior, types, lint, and visual fidelity

**Files:**
- Verify: lib/navigation/routes.test.ts
- Verify: components/ui/BottomNav.test.tsx
- Verify: components/ui/BottomNav.tsx

**Interfaces:**
- Consumes: both focused test suites and existing Expo application entry points.
- Produces: evidence that metadata, interaction behavior, TypeScript, lint, and visual requirements meet the approved specification.

- [ ] **Step 1: Run both focused test suites**

~~~powershell
npx jest lib/navigation/routes.test.ts components/ui/BottomNav.test.tsx --runInBand --config '{"preset":"jest-expo"}'
~~~

Expected: PASS with 12 tests.

- [ ] **Step 2: Check static correctness**

~~~powershell
npx tsc --noEmit
npm run lint
~~~

Expected: both commands exit with code 0.

- [ ] **Step 3: Inspect the redesign in the running app**

~~~powershell
npx expo start --web
~~~

Verify on a main screen:

1. The 72px gradient bar touches the bottom safe area and has the central round notch.
2. The 56px Flamee logo overlaps the bar by 28px and does not respond to press.
3. Only Trang chủ, Hoạt động, Nhiệm vụ, and Hồ sơ are pressable; their glyphs and white 10px labels match Figma.
4. Selecting a tab uses route replacement; navigating to /mood retains the bar with no selected tab.
5. Navigating to /ai, /dates, or /timeline hides the navigation.

- [ ] **Step 4: Record the known full-suite limitation without restoring deleted files**

~~~powershell
npm test
~~~

Expected: the pre-existing Jest validation error for missing test/setup.ts. Do not create or restore that file; the focused suites are the relevant verification for this change.
