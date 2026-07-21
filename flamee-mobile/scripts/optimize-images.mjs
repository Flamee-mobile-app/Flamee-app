import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = dirname(scriptDirectory);

const assets = [
  { id: 'brand.background', source: 'assets/chinh_mau_1.png', output: 'assets/images/brand/app-background.webp', maxWidth: 1080 },
  { id: 'brand.logo', source: 'assets/flamee_logo.png', output: 'assets/images/brand/flamee-logo.webp', maxWidth: 240 },
  { id: 'timeline.hero', source: 'assets/timeline/relationship-hero.jpg', output: 'assets/images/timeline/relationship-hero.webp', maxWidth: 708 },
  { id: 'timeline.together', source: 'assets/timeline/timeline-together.png', output: 'assets/images/timeline/timeline-together.webp', maxWidth: 192 },
  { id: 'timeline.birthday', source: 'assets/timeline/timeline-birthday.png', output: 'assets/images/timeline/timeline-birthday.webp', maxWidth: 192 },
  { id: 'timeline.anniversary', source: 'assets/timeline/timeline-anniversary.png', output: 'assets/images/timeline/timeline-anniversary.webp', maxWidth: 192 },
  { id: 'timeline.special', source: 'assets/timeline/timeline-special.png', output: 'assets/images/timeline/timeline-special.webp', maxWidth: 192 },
  { id: 'timeline.holiday', source: 'assets/timeline/timeline-holiday.png', output: 'assets/images/timeline/timeline-holiday.webp', maxWidth: 192 },
  { id: 'timeline.custom', source: 'assets/timeline/timeline-custom.png', output: 'assets/images/timeline/timeline-custom.webp', maxWidth: 192 },
  { id: 'timeline.movie', source: 'assets/timeline/timeline-movie.png', output: 'assets/images/timeline/timeline-movie.webp', maxWidth: 192 },
  { id: 'timeline.trip', source: 'assets/timeline/timeline-trip.png', output: 'assets/images/timeline/timeline-trip.webp', maxWidth: 192 },
];

const report = [];

for (const asset of assets) {
  const sourcePath = join(projectDirectory, asset.source);
  const outputPath = join(projectDirectory, asset.output);
  const sourceMetadata = await sharp(sourcePath).metadata();

  await mkdir(dirname(outputPath), { recursive: true });
  await sharp(sourcePath)
    .resize({ width: asset.maxWidth, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(outputPath);

  const outputMetadata = await sharp(outputPath).metadata();
  const [sourceStats, outputStats] = await Promise.all([stat(sourcePath), stat(outputPath)]);
  report.push({
    id: asset.id,
    source: asset.source,
    sourceBytes: sourceStats.size,
    sourceDimensions: `${sourceMetadata.width}×${sourceMetadata.height}`,
    output: asset.output,
    outputBytes: outputStats.size,
    outputDimensions: `${outputMetadata.width}×${outputMetadata.height}`,
  });
}

const reportPath = join(projectDirectory, 'assets', 'images', 'asset-manifest.json');
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.table(report);
