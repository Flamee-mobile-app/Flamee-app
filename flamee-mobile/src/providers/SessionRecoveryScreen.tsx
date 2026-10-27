import { Text, YStack } from "tamagui";
import { AppButton, AppSkeleton, AppSkeletonGroup, FeatureScreen } from "../shared/components";
import { getMessage } from "../shared/localization/messages";
import { useSessionStore } from "../shared/state/sessionStore";

export function SessionRecoveryScreen({ pending }: { pending: boolean }) {
  const retry = useSessionStore((state) => state.retryBootstrap);
  return <FeatureScreen title={getMessage("vi", pending ? "loadingTitle" : "sessionRestoreErrorTitle")} scroll={false} withBottomNavigation={false}>
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$lg" padding="$lg">
      {pending ? <AppSkeletonGroup accessibilityLabel={getMessage("vi", "loadingDescription")}><YStack width="100%" alignItems="center" gap="$md"><AppSkeleton width={72} height={72} borderRadius={36} /><AppSkeleton width="68%" height={16} /><AppSkeleton width="46%" height={12} /></YStack></AppSkeletonGroup> : null}
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary" textAlign="center">
        {getMessage("vi", pending ? "loadingDescription" : "sessionRestoreErrorBody")}
      </Text>
      {!pending ? <AppButton onPress={retry}>{getMessage("vi", "retry")}</AppButton> : null}
    </YStack>
  </FeatureScreen>;
}
