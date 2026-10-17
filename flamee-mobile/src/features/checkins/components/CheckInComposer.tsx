import { UnavailableFeature } from "../../../shared/components";

export function CheckInComposer(_props: { onClose?: () => void; onCompleted?: (result: "error") => void }) {
  return <UnavailableFeature title="fabEmotion" description="checkInsNotConnectedBody" />;
}
