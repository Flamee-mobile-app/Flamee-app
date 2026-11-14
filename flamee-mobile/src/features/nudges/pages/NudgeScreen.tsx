import { UnavailableFeature } from "../../../shared/components";

export function NudgeScreen(_props: { nudgeId: string }) {
  return <UnavailableFeature title="tasksTitle" description="nudgesNotConnectedBody" showBack />;
}

export function NudgeSupportUnavailableScreen() {
  return <UnavailableFeature title="supportSettingsTitle" showBack />;
}
