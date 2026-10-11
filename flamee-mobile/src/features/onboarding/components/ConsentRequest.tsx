import { useState } from "react";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Square } from "@tamagui/lucide-icons-2/icons/Square";
import { AppButton, AppHeader, AppScreen, StatusBanner } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { localOnboardingService } from "../localOnboardingService";

export function ConsentRequest({ accountId, onAccepted, onCancel }: { accountId: string; onAccepted: () => void; onCancel: () => void }) {
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return <AppScreen>
    <AppHeader title={getMessage("vi", "consentTitle")} subtitle={getMessage("vi", "consentBody")} />
    <AppButton variant="ghost" icon={accepted ? <Check size={20} color="$primary" aria-hidden={true} /> : <Square size={20} aria-hidden={true} />} role="checkbox" aria-checked={accepted} disabled={busy} onPress={() => setAccepted((value) => !value)}>{getMessage("vi", "consentCheckbox")}</AppButton>
    {failed ? <StatusBanner tone="warning" title={getMessage("vi", "localSaveErrorTitle")} /> : null}
    <AppButton disabled={!accepted || busy} onPress={async () => {
      if (!accepted || busy) return;
      setBusy(true); setFailed(false);
      try { await localOnboardingService.acceptConsent(accountId); onAccepted(); }
      catch { setFailed(true); } finally { setBusy(false); }
    }}>{getMessage("vi", "agreeContinue")}</AppButton>
    <AppButton disabled={busy} variant="ghost" onPress={onCancel}>{getMessage("vi", "skipForNow")}</AppButton>
  </AppScreen>;
}
