# Flamee Asset and Icon System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace scattered component-level local image imports and generic Ionicons usage with a typed Flamee asset registry and a reusable Flamee Icon System, without changing the existing visual contracts.

**Architecture:** Static brand assets remain local and are resolved only through typed feature/shared registries. User/API photos are represented by metadata and rendered through an image component that selects thumbnail versus full image. Flamee icons are individual, optimized SVG source files generated into `react-native-svg` components and exposed through a typed shared API; no screen imports raw SVG paths or Ionicons directly.

**Tech Stack:** Expo 54, React Native 0.81, TypeScript 5.9, `expo-image`, `react-native-svg`, Jest/React Native Testing Library, SVGO, SVGR React Native transform.

## Global Constraints

- Do not render, crop, or parse the supplied `579×1968` SVG sheet at runtime; it is a source artboard, not an icon sprite.
- Do not embed base64 icon/image data in `.ts` or `.tsx` files.
- A component may consume `ImageSource`/`PhotoAsset`/`FlameeIconName`, but must not call `require()` for app imagery or import `@expo/vector-icons`.
- Local static assets use a single typed registry per ownership boundary; user/API images use URLs and metadata, not bundled files.
- Monochrome Flamee icons accept `size`, `color`, and accessibility props; multicolor illustrations accept size/accessibility props but retain their source colors.
- Keep the public visual appearance and existing feature interactions unchanged while migrating implementation boundaries.
- Do not add a runtime SVG transformer. Source SVG is transformed during the explicit generation script, so Metro only consumes generated TSX.

---

## Target file structure

| Path | Responsibility |
| --- | --- |
| `assets/images/brand/` | Optimized local brand backgrounds and logos. |
| `assets/images/timeline/` | Optimized static Timeline hero/type imagery. |
| `assets/icons/source/` | One named, hand-reviewed SVG source per Flamee icon. |
| `shared/assets/brandAssets.ts` | Typed local registry for cross-feature brand imagery. |
| `features/timeline/timelineAssets.ts` | Typed local registry and asset-key resolver for Timeline. |
| `shared/types/media.ts` | `PhotoAsset` and image-variant contracts for API/user media. |
| `shared/components/media/AppImage.tsx` | Cached local/remote image boundary using `expo-image`. |
| `shared/components/icons/generated/` | Generated `react-native-svg` icon components; never edited manually. |
| `shared/components/icons/iconNames.ts` | `FlameeIconName` union and metadata. |
| `shared/components/icons/FlameeIcon.tsx` | Typed monochrome icon dispatcher. |
| `shared/components/icons/FlameeIllustration.tsx` | Typed multicolor illustration dispatcher. |
| `scripts/generate-icons.mjs` | Deterministic SVG optimization and React Native component generation. |
| `docs/design-system/icons.md` | Naming, accessibility, and export rules for future icons. |

### Task 1: Establish the asset inventory and media contracts

**Files:**
- Create: `flamee-mobile/shared/types/media.ts`
- Create: `flamee-mobile/shared/types/media.test.ts`
- Create: `flamee-mobile/docs/design-system/assets.md`
- Modify: `flamee-mobile/shared/types/index.ts`

**Interfaces:**
- Produces `PhotoAsset`, `StaticImageKey`, `ImageVariant`, and
  `resolvePhotoUri(photo, variant)`.

- [ ] **Step 1: Write the failing media-variant test**

```ts
const photo: PhotoAsset = {
  uri: 'https://cdn.example.com/original.webp',
  thumbnailUri: 'https://cdn.example.com/thumb.webp',
  width: 1440,
  height: 960,
  blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
};

expect(resolvePhotoUri(photo, 'thumbnail')).toBe(photo.thumbnailUri);
expect(resolvePhotoUri(photo, 'full')).toBe(photo.uri);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- shared/types/media.test.ts --runInBand`

Expected: FAIL because the media contract does not yet exist.

- [ ] **Step 3: Add the typed media boundary**

```ts
export type ImageVariant = 'thumbnail' | 'full';
export type PhotoAsset = {
  uri: string;
  thumbnailUri: string;
  width: number;
  height: number;
  blurhash?: string;
};

export function resolvePhotoUri(photo: PhotoAsset, variant: ImageVariant) {
  return variant === 'thumbnail' ? photo.thumbnailUri : photo.uri;
}
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- shared/types/media.test.ts --runInBand`

Expected: PASS.

### Task 2: Centralize and optimize static image ownership

**Files:**
- Create: `flamee-mobile/shared/assets/brandAssets.ts`
- Create: `flamee-mobile/shared/assets/brandAssets.test.ts`
- Create: `flamee-mobile/features/timeline/timelineAssets.ts`
- Create: `flamee-mobile/features/timeline/timelineAssets.test.ts`
- Modify: `flamee-mobile/features/timeline/timelineConstants.ts`
- Modify: `flamee-mobile/features/home/screens/HomeScreen.tsx`
- Modify: `flamee-mobile/features/auth/screens/StartScreen.tsx`
- Modify: `flamee-mobile/features/auth/screens/LoginScreen.tsx`
- Modify: `flamee-mobile/features/auth/screens/RegisterScreen.tsx`
- Modify: `flamee-mobile/features/profile/screens/ProfileScreen.tsx`

**Interfaces:**
- Produces `BRAND_ASSETS.appBackground`, `BRAND_ASSETS.logo`,
  `TIMELINE_ASSETS.hero`, and `getTimelineArtwork(key, type)`.

- [ ] **Step 1: Write failing registry-contract tests**

```ts
expect(BRAND_ASSETS.appBackground).toBeDefined();
expect(TIMELINE_ASSETS.hero).toBeDefined();
expect(getTimelineArtwork('trip', 'holiday')).toBe(TIMELINE_ASSETS.trip);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- shared/assets/brandAssets.test.ts features/timeline/timelineAssets.test.ts --runInBand`

Expected: FAIL because registries do not exist.

- [ ] **Step 3: Move all static `require()` calls into owner registries**

```ts
export const BRAND_ASSETS = {
  appBackground: require('@/assets/images/brand/app-background.webp'),
  logo: require('@/assets/images/brand/flamee-logo.webp'),
} as const satisfies Record<string, ImageSource>;
```

Update consuming screens to import `BRAND_ASSETS`; move Timeline artwork
resolution from `timelineConstants.ts` to `timelineAssets.ts` and leave
timeline labels/options in constants only.

- [ ] **Step 4: Optimize source binaries before registering them**

Use a reproducible image optimization command to create WebP files sized for
their largest on-device render: brand background at its actual phone background
dimensions, Timeline hero at its maximum container dimensions, and Timeline
type art at thumbnail dimensions. Preserve each original source image outside
the runtime asset path. Record source/output dimensions and bytes in
`docs/design-system/assets.md`.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- shared/assets/brandAssets.test.ts features/timeline/timelineAssets.test.ts --runInBand; npx tsc --noEmit`

Expected: PASS with no direct static `require()` remaining in feature screen/component files.

### Task 3: Add the cached image component

**Files:**
- Create: `flamee-mobile/shared/components/media/AppImage.tsx`
- Create: `flamee-mobile/shared/components/media/AppImage.test.tsx`
- Create: `flamee-mobile/shared/components/media/index.ts`
- Modify: `flamee-mobile/shared/components/index.ts` if the project public barrel exports media components

**Interfaces:**
- Produces:

```ts
type AppImageProps = {
  source: ImageSource | PhotoAsset;
  variant?: ImageVariant;
  contentFit?: 'cover' | 'contain';
  style: ImageStyle;
  accessibilityLabel?: string;
};
```

- [ ] **Step 1: Write the failing remote thumbnail test**

```ts
render(<AppImage source={photo} style={{ height: 80, width: 80 }} variant="thumbnail" />);
expect(screen.getByTestId('app-image').props.source.uri).toBe(photo.thumbnailUri);
expect(screen.getByTestId('app-image').props.cachePolicy).toBe('memory-disk');
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- shared/components/media/AppImage.test.tsx --runInBand`

Expected: FAIL because `AppImage` does not exist.

- [ ] **Step 3: Implement the image boundary**

Use `expo-image`; resolve `PhotoAsset` through `resolvePhotoUri`, pass
`cachePolicy="memory-disk"`, pass `placeholder={blurhash}` only when
available, and forward explicit caller-provided dimensions/style. Local
`ImageSource` passes through unchanged. Do not prefetch in render.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- shared/components/media/AppImage.test.tsx --runInBand`

Expected: PASS.

### Task 4: Prepare the Flamee icon source catalog

**Files:**
- Create: `flamee-mobile/assets/icons/source/*.svg`
- Create: `flamee-mobile/assets/icons/manifest.json`
- Create: `flamee-mobile/assets/icons/manifest.test.ts`
- Create: `flamee-mobile/docs/design-system/icons.md`

**Interfaces:**
- Produces these initial names:

```ts
export const FLAMEE_ICON_NAMES = [
  'home', 'timeline', 'memoryBook', 'missions', 'profile',
  'add', 'back', 'chevronForward', 'search', 'menu', 'filter',
  'edit', 'delete', 'close', 'chat', 'calendar', 'send',
  'heart', 'gift', 'film', 'umbrella', 'sparkles',
] as const;
```

- [ ] **Step 1: Export source icons from the supplied artboard**

Split the supplied SVG artboard into one reviewed SVG per manifest name.
Each monochrome UI source uses a `24×24` viewBox. Each multicolor illustration
uses its design viewBox and is marked `kind: "illustration"` in the manifest.
Do not use coordinate cropping at runtime and do not duplicate path data by
hand.

- [ ] **Step 2: Write the failing manifest contract test**

```ts
expect(ICON_MANIFEST.timeline).toMatchObject({ kind: 'icon', viewBox: '0 0 24 24' });
expect(ICON_MANIFEST.heart).toMatchObject({ kind: 'illustration' });
```

- [ ] **Step 3: Verify RED**

Run: `npm test -- assets/icons/manifest.test.ts --runInBand`

Expected: FAIL until source files and manifest are present.

- [ ] **Step 4: Verify source policy**

Run: `rg -n '<svg|viewBox=' assets/icons/source; rg -n '<image|data:image' assets/icons/source`

Expected: every source has an SVG/viewBox; second command returns no matches.

### Task 5: Add deterministic SVG optimization and code generation

**Files:**
- Create: `flamee-mobile/scripts/generate-icons.mjs`
- Create: `flamee-mobile/shared/components/icons/generated/*.tsx`
- Create: `flamee-mobile/shared/components/icons/generated/index.ts`
- Modify: `flamee-mobile/package.json`
- Modify: `flamee-mobile/.gitignore` only if generator cache is introduced

**Interfaces:**
- Produces `npm run icons:generate` and checked-in generated TSX components.

- [ ] **Step 1: Write the failing generation-output test**

```ts
expect(GeneratedFlameeIcons.TimelineIcon).toBeDefined();
expect(GeneratedFlameeIcons.HeartIllustration).toBeDefined();
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- shared/components/icons/generated/index.test.ts --runInBand`

Expected: FAIL because generated components do not exist.

- [ ] **Step 3: Implement generator and scripts**

Add dev dependencies `svgo` and `@svgr/core`. The generator must read the
manifest, run SVGO with metadata/comment removal while preserving viewBox and
gradients, then produce a TSX component backed by `react-native-svg`.

```json
{
  "scripts": {
    "icons:generate": "node scripts/generate-icons.mjs",
    "icons:check": "npm run icons:generate && git diff --exit-code -- shared/components/icons/generated"
  }
}
```

- [ ] **Step 4: Verify GREEN**

Run: `npm run icons:generate; npm test -- shared/components/icons/generated/index.test.ts --runInBand; npm run icons:check`

Expected: components exist, unit test passes, and second generation produces no diff.

### Task 6: Expose typed Flamee icon APIs

**Files:**
- Create: `flamee-mobile/shared/components/icons/iconNames.ts`
- Create: `flamee-mobile/shared/components/icons/FlameeIcon.tsx`
- Create: `flamee-mobile/shared/components/icons/FlameeIllustration.tsx`
- Create: `flamee-mobile/shared/components/icons/FlameeIcon.test.tsx`
- Create: `flamee-mobile/shared/components/icons/index.ts`
- Modify: `flamee-mobile/shared/components/ui/IconButton.tsx`

**Interfaces:**

```ts
type FlameeIconProps = {
  name: FlameeIconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
};

type FlameeIllustrationProps = {
  name: FlameeIllustrationName;
  size: number;
  accessibilityLabel?: string;
};
```

- [ ] **Step 1: Write failing API tests**

```ts
render(<FlameeIcon name="filter" size={20} color="#FF7158" />);
expect(screen.getByTestId('flamee-icon-filter')).toBeTruthy();
expect(() => render(<FlameeIcon name={'unknown' as FlameeIconName} />)).toThrow();
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- shared/components/icons/FlameeIcon.test.tsx --runInBand`

Expected: FAIL because public icon APIs do not exist.

- [ ] **Step 3: Implement dispatch without runtime SVG parsing**

`FlameeIcon` selects a generated monochrome component by typed name and passes
size/color. `FlameeIllustration` selects only generated multicolor components
and does not accept color override. Change `IconButton` to consume
`FlameeIconName`; remove its `Ionicons` import.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- shared/components/icons/FlameeIcon.test.tsx shared/components/ui/IconButton.test.tsx --runInBand`

Expected: PASS.

### Task 7: Migrate the first visible surfaces and enforce boundaries

**Files:**
- Modify: `flamee-mobile/shared/components/ui/BottomNav.tsx`
- Modify: `flamee-mobile/features/timeline/components/TimelineListCard.tsx`
- Modify: `flamee-mobile/features/home/screens/HomeScreen.tsx`
- Modify: `flamee-mobile/features/memory-book/screens/MemoryBookScreen.tsx`
- Modify: associated tests
- Create: `flamee-mobile/shared/components/icons/icon-boundary.test.ts`

**Interfaces:**
- Consumers use `FlameeIcon`/`FlameeIllustration` and `AppImage`; no direct
  `Ionicons`/`require()` remains in these migrated screen/components.

- [ ] **Step 1: Write the failing boundary test**

```ts
const source = readFileSync('features/timeline/components/TimelineListCard.tsx', 'utf8');
expect(source).not.toContain('@expo/vector-icons');
expect(source).toContain("@/shared/components/icons");
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- shared/components/icons/icon-boundary.test.ts --runInBand`

Expected: FAIL because migrated surfaces still use Ionicons/direct image imports.

- [ ] **Step 3: Migrate surface by surface**

Replace each direct Ionicons usage with its semantic Flamee icon and replace
each direct static image import with `AppImage` plus the applicable registry.
Retain precise layout dimensions and accessibility labels so visual behaviour
does not change.

- [ ] **Step 4: Verify GREEN and perform final checks**

Run:

```powershell
npm test -- --runInBand
npx tsc --noEmit
npm run lint
npm run icons:check
rg -n '@expo/vector-icons|require\(' shared/components/ui/BottomNav.tsx features/timeline/components/TimelineListCard.tsx features/home/screens/HomeScreen.tsx features/memory-book/screens/MemoryBookScreen.tsx
```

Expected: Jest, TypeScript, lint, and icon generation all pass; final `rg`
returns no direct Ionicons/static-require use in the migrated surfaces.

## Deferred backend/CDN integration

Once an image service exists, API responses must provide both full and
thumbnail URLs plus original dimensions and optional BlurHash matching
`PhotoAsset`. No UI rewrite is required: API-to-domain mapping produces
`PhotoAsset`, while `AppImage` chooses the requested variant. This plan does
not invent a CDN endpoint or add a remote-image fallback before that service
is available.

## Plan self-review

- Tasks 1–3 address image hard-coding and runtime image performance.
- Tasks 4–7 build, expose, and migrate the Flamee Icon System.
- Static assets, user media, monochrome icons, and multicolor illustrations
  have separate contracts; no task relies on runtime sheet cropping.
- Every production task has an explicit red-green verification path.
