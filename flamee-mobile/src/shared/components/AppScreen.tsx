import type { ComponentProps, PropsWithChildren, ReactElement } from "react";
import type { RefreshControlProps } from "react-native";
import { ScrollView, YStack, type YStackProps } from "tamagui";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AmbientBackground } from "./AmbientBackground";
import { useAppHeaderLayout } from "../navigation/appHeaderContext";

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  contentProps?: YStackProps;
  refreshControl?: ReactElement<RefreshControlProps>;
  safeAreaEdges?: ComponentProps<typeof SafeAreaView>["edges"];
  reserveHeaderSpace?: boolean;
  allowOverflow?: boolean;
}>;

export function AppScreen({ children, scroll = true, padded = true, contentProps, refreshControl, safeAreaEdges = ["top", "left", "right", "bottom"], reserveHeaderSpace = true, allowOverflow = false }: AppScreenProps) {
  const { visible: hasHeader, contentOffset } = useAppHeaderLayout();
  const insets = useSafeAreaInsets();
  const headerInset = hasHeader && reserveHeaderSpace ? insets.top + contentOffset : 0;
  const edges = hasHeader && Array.isArray(safeAreaEdges) ? safeAreaEdges.filter((edge) => edge !== "top") : safeAreaEdges;
  const content = (
    <YStack
      flexGrow={1}
      backgroundColor="transparent"
      paddingHorizontal={padded ? "$lg" : 0}
      paddingTop={hasHeader ? 0 : padded ? "$lg" : 0}
      paddingBottom={padded ? "$lg" : 0}
      gap="$lg"
      {...contentProps}
    >
      {children}
    </YStack>
  );

  return (
    <YStack flex={1} backgroundColor="$background" overflow={allowOverflow ? "visible" : "hidden"}>
      <AmbientBackground />
      <SafeAreaView style={{ flex: 1, paddingTop: headerInset }} edges={edges}>
        {scroll ? (
          <ScrollView flex={1} backgroundColor="transparent" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>
            {content}
          </ScrollView>
        ) : (
          <YStack flex={1} backgroundColor="transparent">
            {content}
          </YStack>
        )}
      </SafeAreaView>
    </YStack>
  );
}
