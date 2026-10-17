import { getMessage, type MessageKey } from "../localization/messages";
import { AsyncStateView } from "./AsyncStateView";
import { FeatureScreen } from "./FeatureScreen";

/** A missing capability is never rendered as an empty, successfully loaded feed. */
export function UnavailableFeature({ title, description = "featureNotConnectedBody", showBack = false, onBack }: {
  title: MessageKey;
  description?: MessageKey;
  showBack?: boolean;
  onBack?: () => void;
}) {
  return <FeatureScreen title={getMessage("vi", title)} showBack={showBack} onBack={onBack}>
    <AsyncStateView variant="pending" title="featureNotConnectedTitle" description={description} />
  </FeatureScreen>;
}
