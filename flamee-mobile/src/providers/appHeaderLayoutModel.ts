import { featureTitleTokens, liquidHeaderTokens, memoryFeedTokens } from "../shared/constants/tokens.ts";

export function getAppHeaderContentOffset(isHome: boolean): number {
  return isHome
    ? liquidHeaderTokens.topGap + memoryFeedTokens.headerHeight + liquidHeaderTokens.contentGap
    : featureTitleTokens.height + featureTitleTokens.contentGap;
}
