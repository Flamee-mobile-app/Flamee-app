import { useLocalSearchParams } from "expo-router";
import { MomentDetailScreen } from "../../src/features/moments";

export default function MomentRoute() {
  const { momentId } = useLocalSearchParams<{ momentId: string }>();
  return <MomentDetailScreen momentId={momentId} />;
}
