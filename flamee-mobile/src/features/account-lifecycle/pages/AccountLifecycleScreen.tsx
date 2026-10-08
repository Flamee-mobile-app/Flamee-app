import { Download, LifeBuoy, LogOut } from "@tamagui/lucide-icons-2";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import { AppButton, AppField, ChoiceChip, SectionCard, StatusBanner } from "../../../shared/components";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { localCoupleService } from "../../couple";
import { DoubleConfirmDialog } from "../components/DoubleConfirmDialog";
import { createLocalAccountLifecycleService, type LocalExportPreview } from "../localAccountLifecycleService";

type Mode = "data" | "support" | "account";

export function AccountLifecycleScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const accountId = useSessionStore((session) => session.activeAccountId);
  const service = useMemo(() => createLocalAccountLifecycleService({
    session: {
      getActiveAccountId: () => useSessionStore.getState().activeAccountId,
      getActiveCoupleId: () => useSessionStore.getState().activeCoupleId,
      setActiveCouple: (coupleId) => useSessionStore.getState().setActiveCouple(coupleId),
      reset: () => useSessionStore.getState().reset(),
    },
  }), []);
  const [busy, setBusy] = useState(false);
  const [supportKind, setSupportKind] = useState<"contact" | "bug" | "content">("contact");
  const [message, setMessage] = useState("");
  const [supportResult, setSupportResult] = useState<"idle" | "not_sent_local" | "validation" | "error">("idle");
  const [exportState, setExportState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [exportPreview, setExportPreview] = useState<LocalExportPreview | null>(null);
  const [membership, setMembership] = useState<Awaited<ReturnType<typeof localCoupleService.getMembership>> | null>(null);
  const [membershipAccountId, setMembershipAccountId] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(mode === "account");
  const [accountLoadFailed, setAccountLoadFailed] = useState(false);

  const loadMembership = async () => {
    if (!accountId) { setAccountLoading(false); setAccountLoadFailed(true); return; }
    setAccountLoading(true); setAccountLoadFailed(false);
    try { setMembership(await localCoupleService.getMembership(accountId)); setMembershipAccountId(accountId); }
    catch { setAccountLoadFailed(true); }
    finally { setAccountLoading(false); }
  };
  useEffect(() => {
    if (mode === "account") void loadMembership();
  }, [mode, accountId]);

  const prepareExport = async () => {
    if (!accountId) { setExportState("error"); return; }
    setExportState("loading");
    try {
      const result = await service.prepareLocalExport(accountId);
      setExportPreview(result.preview);
      setExportState("ready");
    } catch { setExportState("error"); }
  };
  const submitSupport = async () => {
    setBusy(true); setSupportResult("idle");
    try {
      const result = await service.submitLocalSupportRequest(supportKind, message);
      setSupportResult(result.kind);
    } catch { setSupportResult("error"); }
    finally { setBusy(false); }
  };
  const unpair = async () => {
    if (!accountId) return;
    setBusy(true);
    try {
      const result = await service.unpair(accountId);
      if (result.kind === "unpaired") router.replace("/(invite)");
      else setAccountLoadFailed(true);
    } catch { setAccountLoadFailed(true); }
    finally { setBusy(false); }
  };
  const signOut = async () => {
    if (!accountId) return;
    setBusy(true);
    try {
      const result = await service.signOut(accountId);
      if (result.kind === "signed_out") router.replace("/(auth)");
      else setAccountLoadFailed(true);
    } catch { setAccountLoadFailed(true); }
    finally { setBusy(false); }
  };
  const deleteAccount = async () => {
    if (!accountId) return;
    setBusy(true);
    try {
      const result = await service.deleteLocalAccount(accountId);
      if (result.kind === "deleted_local") router.replace("/(auth)");
      else setAccountLoadFailed(true);
    } catch { setAccountLoadFailed(true); }
    finally { setBusy(false); }
  };

  if (mode === "data") {
    return (
      <YStack gap="$lg">
        <SectionCard title={getMessage("vi", "exportTitle")} description={getMessage("vi", "exportLocalOnlyBody")}>
          <AppButton icon={<Download size={18} />} disabled={exportState === "loading"} onPress={() => void prepareExport()}>{getMessage("vi", "prepareExportPreview")}</AppButton>
        </SectionCard>
        {exportState === "loading" ? <StatusBanner tone="info" title={getMessage("vi", "loadingTitle")} description={getMessage("vi", "loadingDescription")} /> : null}
        {exportState === "error" ? <StatusBanner tone="warning" title={getMessage("vi", "exportError")} /> : null}
        {exportState === "ready" && exportPreview ? <SectionCard title={getMessage("vi", "exportPreviewTitle")} description={getMessage("vi", "exportPreviewBody")}><Text selectable fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{JSON.stringify(exportPreview, null, 2)}</Text></SectionCard> : null}
      </YStack>
    );
  }
  if (mode === "support") {
    return (
      <YStack gap="$lg">
        <SectionCard title={getMessage("vi", "supportTitle")} description={getMessage("vi", "supportBody")}>
          <XStack flexWrap="wrap" gap="$sm"><ChoiceChip label={getMessage("vi", "supportContact")} selected={supportKind === "contact"} onPress={() => setSupportKind("contact")} /><ChoiceChip label={getMessage("vi", "supportBug")} selected={supportKind === "bug"} onPress={() => setSupportKind("bug")} /><ChoiceChip label={getMessage("vi", "supportContent")} selected={supportKind === "content"} onPress={() => setSupportKind("content")} /></XStack>
          <AppField multiline label={getMessage("vi", "supportMessageLabel")} value={message} onChangeText={setMessage} maxLength={500} characterCount={`${message.length}/500`} />
          <AppButton icon={<LifeBuoy size={18} />} disabled={busy} onPress={() => void submitSupport()}>{getMessage("vi", "validateSupportRequest")}</AppButton>
        </SectionCard>
        {supportResult !== "idle" ? <StatusBanner tone={supportResult === "not_sent_local" ? "info" : "warning"} title={getMessage("vi", supportResult === "not_sent_local" ? "supportNotSentLocal" : supportResult === "validation" ? "supportValidationError" : "supportError")} /> : null}
      </YStack>
    );
  }
  if (accountLoading || (!accountLoadFailed && accountId !== null && membershipAccountId !== accountId)) return <YStack gap="$lg"><StatusBanner tone="info" title={getMessage("vi", "loadingTitle")} description={getMessage("vi", "loadingDescription")} /></YStack>;
  if (accountLoadFailed || !accountId || !membership) return <YStack gap="$lg"><StatusBanner tone="warning" title={getMessage("vi", "accountLoadError")} /><AppButton variant="secondary" onPress={() => void loadMembership()}>{getMessage("vi", "retry")}</AppButton></YStack>;
  return (
    <YStack gap="$lg">
      <SectionCard title={getMessage("vi", "signOutTitle")} description={getMessage("vi", "signOutBody")}><AppButton variant="secondary" icon={<LogOut size={18} />} disabled={busy} onPress={() => void signOut()}>{getMessage("vi", "signOutAction")}</AppButton></SectionCard>
      {membership.status === "paired" && membership.partner ? <DoubleConfirmDialog title={formatMessage("vi", "unpairTitle", { name: membership.partner.nickname || membership.partner.displayName })} description={getMessage("vi", "unpairBody")} phrase={getMessage("vi", "unpairConfirmationPhrase")} busy={busy} actionLabel={getMessage("vi", "confirmUnpair")} onConfirm={unpair} /> : null}
      <SectionCard tone="peach" title={getMessage("vi", "exportBeforeDeleteTitle")} description={getMessage("vi", "exportBeforeDeleteBody")}><AppButton variant="secondary" icon={<Download size={18} />} onPress={() => router.push({ pathname: "/settings", params: { section: "data" } })}>{getMessage("vi", "openDataExport")}</AppButton></SectionCard>
      <DoubleConfirmDialog title={getMessage("vi", "deleteAccountTitle")} description={getMessage("vi", "deleteAccountBody")} phrase={getMessage("vi", "deleteAccountConfirmationPhrase")} busy={busy} actionLabel={getMessage("vi", "confirmDeleteAccount")} onConfirm={deleteAccount} />
    </YStack>
  );
}
