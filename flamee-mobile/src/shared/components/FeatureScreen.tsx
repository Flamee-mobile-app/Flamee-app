import type { PropsWithChildren, ReactElement } from "react";
import type { RefreshControlProps } from "react-native";
import type { YStackProps } from "tamagui";
import { featureTokens } from "../constants/tokens";
import { useAppHeader } from "../navigation/appHeaderContext";
import { AppScreen } from "./AppScreen";
import { ContentSurface } from "./ContentSurface";

type FeatureScreenProps = PropsWithChildren<{
  title: string;
  titleTone?: "default" | "accent";
  showBack?: boolean;
  onBack?: () => void;
  scroll?: boolean;
  withBottomNavigation?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  surfaceProps?: YStackProps;
}>;

/** A feature title sits outside one elevated surface; no page subtitle. */
export function FeatureScreen({ title, titleTone, showBack, onBack, scroll = true, withBottomNavigation = true, refreshControl, surfaceProps, children }: FeatureScreenProps) {
  useAppHeader({ title, showBack, onBack });
  return (
    <AppScreen scroll={scroll} refreshControl={refreshControl} contentProps={{
      width: "100%",
      maxWidth: featureTokens.maxWidth,
      alignSelf: "center",
      flex: scroll ? undefined : 1,
      paddingBottom: withBottomNavigation ? featureTokens.navigationClearance : "$xl",
    }}>
      <ContentSurface flexGrow={1} flex={scroll ? undefined : 1} minHeight={0} {...surfaceProps}>
        {children}
      </ContentSurface>
    </AppScreen>
  );
}
