import { InviteScreen } from "../../src/features/invites/screens";
import { useLocalSearchParams } from "expo-router";

export default function InviteRoute() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  return <InviteScreen initialMode={mode === "join" ? "join" : "choose"} />;
}
