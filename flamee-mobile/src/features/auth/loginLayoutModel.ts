import { loginTokens, spacing } from "../../shared/constants/tokens.ts";

export function resolveLoginHeroHeight(topInset: number): number {
  return loginTokens.heroMinHeight + Math.max(0, topInset);
}

export function resolveLoginLayout({
  topInset,
  bottomInset,
}: {
  topInset: number;
  bottomInset: number;
}) {
  const heroHeight = resolveLoginHeroHeight(topInset);

  return {
    heroHeight,
    surfacePaddingBottom: Math.max(bottomInset, spacing.lg),
    titleGap: spacing.md,
    footerTopGap: spacing.md,
  } as const;
}
