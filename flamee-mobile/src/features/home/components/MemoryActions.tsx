import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Text, YStack } from "tamagui";
import { AppButton, AppDialog, appToast } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { isMemoryMutationScopeCurrent, memoryQueryKeys, memoryService, type MemoryDetail, type MemoryScope } from "../../moments";
import { reconcileMemoryDeletion } from "../memoryEditModel";

export function MemoryActions({ record, scope, onDeleted, onEdit }: { record: MemoryDetail; scope: MemoryScope; onDeleted: () => void; onEdit: (record: MemoryDetail) => void }) {
  const client = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);
  const lock = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const current = () => isMemoryMutationScopeCurrent(scope, useSessionStore.getState());
  const submit = async () => {
    if (!confirming || lock.current || !current()) return;
    const feedback = appToast.operation();
    feedback.loading(getMessage("vi", "memoryDeleting"));
    lock.current = true; setBusy(true); setFailed(false);
    try {
      // Cancel in-flight reads so an older response cannot restore stale post data.
      await client.cancelQueries({ queryKey: memoryQueryKeys.scope(scope) });
      if (!current()) return;
      await memoryService.remove(scope, record.id);
      if (!current()) return;
      client.setQueryData(memoryQueryKeys.feed(scope), (old: Parameters<typeof reconcileMemoryDeletion>[0]) => reconcileMemoryDeletion(old, record.id));
      client.removeQueries({ queryKey: memoryQueryKeys.detail(scope, record.id), exact: true });
      feedback.success(getMessage("vi", "memoryDeleted"));
      if (mounted.current) { setConfirming(false); onDeleted(); }
      void client.invalidateQueries({ queryKey: memoryQueryKeys.scope(scope) });
    } catch {
      if (current()) {
        feedback.error(getMessage("vi", "memoryActionError"));
        if (mounted.current) setFailed(true);
        // A timeout may follow a committed write. Re-read before another attempt.
        void client.invalidateQueries({ queryKey: memoryQueryKeys.scope(scope) });
      }
    } finally {
      lock.current = false;
      feedback.dismiss();
      if (mounted.current) setBusy(false);
    }
  };
  return <YStack gap="$md" paddingHorizontal="$xs" paddingVertical="$xs">
    <AppButton testID="memory-edit-inline" variant="secondary" depth="subtle" disabled={busy || confirming} onPress={() => { if (!lock.current) onEdit(record); }}>{getMessage("vi", "memoryEdit")}</AppButton>
    <AppButton testID="memory-delete-start" variant="destructive" depth="subtle" disabled={busy || confirming} onPress={() => { setFailed(false); setConfirming(true); }}>{getMessage("vi", "memoryDelete")}</AppButton>
    {confirming ? <AppDialog open aboveSheet avoidKeyboard titleTone="plain" title={getMessage("vi", "memoryDeleteTitle")} description={getMessage("vi", "memoryDeleteBody")} dismissible={!busy}
      onOpenChange={(open) => { if (!open && !lock.current) { setConfirming(false); setFailed(false); } }}>
      {failed ? <Text role="alert" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$accentText">{getMessage("vi", "memoryActionError")}</Text> : null}
      <AppButton testID="memory-delete-confirm" variant="destructive" loading={busy} onPress={() => { void submit(); }}>{getMessage("vi", "memoryDelete")}</AppButton>
      <AppButton testID="memory-delete-cancel" variant="ghost" disabled={busy} onPress={() => { setConfirming(false); setFailed(false); }}>{getMessage("vi", "memoryActionCancel")}</AppButton>
    </AppDialog> : null}
  </YStack>;
}
