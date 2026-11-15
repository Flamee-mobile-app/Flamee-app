import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Text, YStack } from "tamagui";
import { AppButton, AppDialog, AppField } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { isMemoryMutationScopeCurrent, memoryQueryKeys, memoryService, type MemoryDetail, type MemoryScope } from "../../moments";

type Action = { kind: "edit" } | { kind: "delete" };

export function MemoryActions({ record, scope, onDeleted }: { record: MemoryDetail; scope: MemoryScope; onDeleted: () => void }) {
  const client = useQueryClient();
  const [action, setAction] = useState<Action | null>(null);
  const [title, setTitle] = useState(record.title);
  const [description, setDescription] = useState(record.description ?? "");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);
  const lock = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const current = () => mounted.current && isMemoryMutationScopeCurrent(scope, useSessionStore.getState());
  const begin = (next: Action) => {
    if (lock.current) return;
    setTitle(record.title); setDescription(record.description ?? ""); setFailed(false); setAction(next);
  };
  const submit = async () => {
    if (!action || lock.current || !current()) return;
    lock.current = true; setBusy(true); setFailed(false);
    try {
      // Cancel in-flight reads so an older response cannot restore stale post data.
      await client.cancelQueries({ queryKey: memoryQueryKeys.scope(scope) });
      if (!current()) return;
      if (action.kind === "edit") {
        const updated = await memoryService.update(scope, record.id, { title: title.trim(), description: description.trim() || null });
        if (!current()) return;
        client.setQueryData(memoryQueryKeys.detail(scope, record.id), updated);
      } else {
        await memoryService.remove(scope, record.id);
        if (!current()) return;
        onDeleted();
        client.removeQueries({ queryKey: memoryQueryKeys.detail(scope, record.id), exact: true });
      }
      if (!current()) return;
      setAction(null);
      void client.invalidateQueries({ queryKey: memoryQueryKeys.scope(scope) });
    } catch {
      if (current()) {
        setFailed(true);
        // A timeout may follow a committed write. Re-read before another attempt.
        void client.invalidateQueries({ queryKey: memoryQueryKeys.scope(scope) });
      }
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const actionTitle = action?.kind === "edit" ? "memoryEdit" : "memoryDelete";
  return <YStack gap="$md" paddingHorizontal="$xs" paddingVertical="$xs">
    <AppButton variant="secondary" depth="subtle" onPress={() => begin({ kind: "edit" })}>{getMessage("vi", "memoryEdit")}</AppButton>
    <AppButton variant="destructive" depth="subtle" onPress={() => begin({ kind: "delete" })}>{getMessage("vi", "memoryDelete")}</AppButton>
    <AppDialog open={action !== null} dismissible={!busy} onOpenChange={(open) => { if (!open && !lock.current) setAction(null); }} title={getMessage("vi", actionTitle)} description={getMessage("vi", action?.kind === "edit" ? "memoryEditBody" : "memoryDeleteBody")} avoidKeyboard>
      {action?.kind === "edit" ? <YStack gap="$md">
        <AppField label={getMessage("vi", "memoryEditTitle")} value={title} onChangeText={setTitle} maxLength={200} editable={!busy} />
        <AppField label={getMessage("vi", "memoryEditDescription")} value={description} onChangeText={setDescription} maxLength={4000} multiline editable={!busy} />
      </YStack> : null}
      {failed ? <Text role="alert" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$accentText">{getMessage("vi", "memoryActionError")}</Text> : null}
      <AppButton variant={action?.kind === "delete" ? "destructive" : "primary"} loading={busy} disabled={action?.kind === "edit" && !title.trim()} onPress={() => { void submit(); }}>{getMessage("vi", action?.kind === "edit" ? "memorySave" : "memoryActionConfirm")}</AppButton>
      <AppButton variant="ghost" disabled={busy} onPress={() => setAction(null)}>{getMessage("vi", "memoryActionCancel")}</AppButton>
    </AppDialog>
  </YStack>;
}
