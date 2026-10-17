import { UnavailableFeature } from "../../../shared/components";

export function MomentsScreen(_props: { composerRequest?: string; initialText?: string; initialKind?: "text" | "voice" | "photo" | "signal"; fromNudgeId?: string }) {
  return <UnavailableFeature title="momentsTitle" description="timelineNotConnectedBody" />;
}
