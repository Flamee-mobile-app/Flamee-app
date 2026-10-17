import type { PropsWithChildren, ReactElement } from "react";
import type { RefreshControlProps } from "react-native";
import { featureTokens } from "../constants/tokens";
import { AppHeader } from "./AppHeader";
import { AppScreen } from "./AppScreen";
import { ContentSurface } from "./ContentSurface";

type FeatureScreenProps = PropsWithChildren<{
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  scroll?: boolean;
  withBottomNavigation?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
}>;

/** A feature title sits outside one elevated surface; no page subtitle. */
export function FeatureScreen({ title, showBack, onBack, scroll = true, withBottomNavigation = true, refreshControl, children }: FeatureScreenProps) {
  return (
    <AppScreen scroll={scroll} refreshControl={refreshControl} contentProps={{
      width: "100%",
      maxWidth: featureTokens.maxWidth,
      alignSelf: "center",
      flex: scroll ? undefined : 1,
      paddingBottom: withBottomNavigation ? featureTokens.navigationClearance : "$xl",
    }}>
      <AppHeader title={title} showBack={showBack} onBack={onBack} />
      <ContentSurface flexGrow={1} flex={scroll ? undefined : 1} minHeight={0}>
        {children}
      </ContentSurface>
    </AppScreen>
  );
}
