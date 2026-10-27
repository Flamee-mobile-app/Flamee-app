import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Text, YStack } from "tamagui";
import { AppButton, AppDialog, AppField } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { isMemoryMutationScopeCurrent, memoryQueryKeys, memoryService, type MemoryDetail, type MemoryScope } from "../../moments";

type Action = { kind: "edit" } | { kind: "delete" } | { kind: "photo"; id: string };

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
      // Cancel in-flight reads so an older response cannot restore a deleted photo.
      await client.cancelQueries({ queryKey: memoryQueryKeys.scope(scope) });
      if (!current()) return;
      if (action.kind === "edit") {
        const updated = await memoryService.update(scope, record.id, { title: title.trim(), description: description.trim() || null });
        if (!current()) return;
        client.setQueryData(memoryQueryKeys.detail(scope, record.id), updated);
      } else if (action.kind === "photo") {
        await memoryService.removeImage(scope, record.id, action.id);
        if (!current()) return;
        client.setQueryData<MemoryDetail>(memoryQueryKeys.detail(scope, record.id), (previous) => previous ? { ...previous, images: previous.images.filter((photo) => photo.id !== action.id) } : previous);
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
  const actionTitle = action?.kind === "edit" ? "memoryEdit" : action?.kind === "photo" ? "memoryDeletePhoto" : "memoryDelete";
  return <YStack gap="$sm">
    <AppButton variant="secondary" onPress={() => begin({ kind: "edit" })}>{getMessage("vi", "memoryEdit")}</AppButton>
    {record.images.map((photo, index) => <AppButton key={photo.id} variant="ghost" onPress={() => begin({ kind: "photo", id: photo.id })}>{`${getMessage("vi", "memoryDeletePhoto")} ${index + 1}`}</AppButton>)}
    <AppButton variant="ghost" onPress={() => begin({ kind: "delete" })}>{getMessage("vi", "memoryDelete")}</AppButton>
    <AppDialog open={action !== null} dismissible={!busy} onOpenChange={(open) => { if (!open && !lock.current) setAction(null); }} title={getMessage("vi", actionTitle)} description={getMessage("vi", action?.kind === "edit" ? "memoryEditBody" : action?.kind === "photo" ? "memoryDeletePhotoBody" : "memoryDeleteBody")} avoidKeyboard>
      {action?.kind === "edit" ? <YStack gap="$md">
        <AppField label={getMessage("vi", "memoryEditTitle")} value={title} onChangeText={setTitle} maxLength={200} editable={!busy} />
        <AppField label={getMessage("vi", "memoryEditDescription")} value={description} onChangeText={setDescription} maxLength={4000} multiline editable={!busy} />
      </YStack> : null}
      {failed ? <Text role="alert" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$accentText">{getMessage("vi", "memoryActionError")}</Text> : null}
      <AppButton loading={busy} disabled={action?.kind === "edit" && !title.trim()} onPress={() => { void submit(); }}>{getMessage("vi", action?.kind === "edit" ? "memorySave" : "memoryActionConfirm")}</AppButton>
      <AppButton variant="ghost" disabled={busy} onPress={() => setAction(null)}>{getMessage("vi", "memoryActionCancel")}</AppButton>
    </AppDialog>
  </YStack>;
}
