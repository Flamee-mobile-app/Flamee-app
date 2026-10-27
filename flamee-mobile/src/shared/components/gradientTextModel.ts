type NativeLine = { text: string; x: number; y: number; ascender: number; height: number; width: number };

/** Keep native text visible until its actual glyph layout can be reproduced. */
export function getGradientTextLines(lines: readonly NativeLine[], maximumLines?: number, fontScale = 1) {
  // Capped iOS lines do not expose reliable ellipsis glyphs. Android large SP
  // text may scale nonlinearly; keep real native text for both cases.
  if (!lines.length || maximumLines !== undefined || fontScale !== 1) return null;
  if (lines.some((line) => ![line.x, line.y, line.ascender, line.height, line.width].every(Number.isFinite) || line.height <= 0 || line.ascender <= 0)) return null;
  return lines.map((line) => ({ text: line.text, x: line.x, baseline: line.y + line.ascender }));
}
