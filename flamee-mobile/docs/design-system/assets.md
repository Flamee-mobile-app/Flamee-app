# Asset and icon system

Static app-owned media is registered in `shared/assets`; feature-specific static media
lives in that feature's asset module. UI components consume a typed registry entry rather
than calling `require()` themselves.

User-generated media is represented by `PhotoAsset`. It deliberately carries both a full
and thumbnail URL, dimensions, and an optional BlurHash. `resolvePhotoUri` selects the
appropriate URL before it reaches an image component.

Custom icons are source-controlled as reviewed, named SVG files and generated into React
Native SVG components. The app never parses or crops a design-artboard SVG at runtime.
See `icons.md` for the source and generation policy.

`npm run images:optimize` uses `sharp` to generate the runtime WebP files and
updates `assets/images/asset-manifest.json`. Originals remain in `assets/` as
source material and are not referenced by UI.

| Asset group | Source bytes | Runtime WebP bytes |
| --- | ---: | ---: |
| Brand background (`1080×587`) | 886,512 | 79,662 |
| Brand logo (`262×312` → `240×286`) | 9,291 | 9,116 |
| Timeline hero (`474×711`) | 22,038 | 13,422 |
| Timeline type artwork (8 files) | 268,887 | 43,916 |
