import { useEffect, useRef, useState, type RefObject } from "react";
import { randomUUID } from "expo-crypto";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppSheet, AppField, AppPhotoPicker, appToast, type AppBlurTargetView } from "../../../shared/components";
import { buttonTokens, spacing } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { localMediaAdapter } from "../../media";
import { createMemoryPhotoDraft } from "../memoryPhotoDraft";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { memoryService, publishMemoryPost, type MemoryPostCheckpoint, type MemoryPostStage } from "../../moments";
import { localCalendarDay } from "../memoryCalendarModel";

export function MemoryComposerDialog({ open, blurTarget, onClose, onAfterClose, onPosted }: {
  open: boolean;
  blurTarget: RefObject<AppBlurTargetView | null>;
  onClose: () => void;
  onAfterClose: () => void;
  onPosted: () => void;
}) {
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<{ uri: string; width?: number; height?: number } | null>(null);
  const [preview, setPreview] = useState<{ uri: string; width?: number; height?: number } | null>(null);
  const [bodyHeight, setBodyHeight] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"denied" | "unavailable" | null>(null);
  const draft = useRef<ReturnType<typeof createMemoryPhotoDraft> | null>(null);
  const picking = useRef(false);
  const posting = useRef(false);
  const active = useRef(true);
  const visible = useRef(open);
  visible.current = open;
  const requestKey = useRef<string | null>(null);
  const checkpoint = useRef<MemoryPostCheckpoint>({});
  const submittedPayload = useRef<{ title: string; category: string; memory_date: string } | null>(null);
  const [stage, setStage] = useState<MemoryPostStage | null>(null);
  const stageRef = useRef<MemoryPostStage | null>(null);
  const [frozen, setFrozen] = useState(false);
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const current = () => active.current && visible.current && useSessionStore.getState().activeAccountId === accountId && useSessionStore.getState().activeCoupleId === coupleId;

  useEffect(() => {
    const current = createMemoryPhotoDraft(localMediaAdapter);
    active.current = true;
    draft.current = current;
    return () => { active.current = false; draft.current = null; void current.dispose(); };
  }, []);

  const selectPhoto = async () => {
    const current = draft.current;
    if (!visible.current || !current || picking.current || posting.current || frozen) return;
    picking.current = true;
    setBusy(true); setError(null);
    try {
      const result = await current.select((asset) => { if (visible.current && draft.current === current) setPreview(asset); });
      if (!visible.current || draft.current !== current || !result) return;
      if (result.kind === "selected") setPhoto(result);
      else if (result.kind !== "cancelled") setError(result.kind);
    } finally {
      picking.current = false;
      if (visible.current && draft.current === current) { setBusy(false); setPreview(null); }
    }
  };

  const removePhoto = () => {
    if (!visible.current || posting.current || frozen) return;
    setPhoto(null);
    setPreview(null);
    setError(null);
    const current = draft.current;
    if (current) void current.remove();
  };

  const close = () => { if (!posting.current) { visible.current = false; onClose(); } };
  const post = async () => {
    if (posting.current || picking.current || !accountId || !coupleId || !current() || (!text.trim() && !photo)) return;
    posting.current = true;
    setFrozen(true);
    try {
      requestKey.current ??= randomUUID();
      submittedPayload.current ??= { title: text.trim() || getMessage("vi", "memoryComposerDefaultTitle"), category: "moment", memory_date: localCalendarDay(new Date()) };
      const result = await publishMemoryPost({ accountId, requestKey: requestKey.current, checkpoint: checkpoint.current, payload: submittedPayload.current, photo: photo ? { uri: photo.uri, name: "memory.jpg", type: "image/jpeg" } : null }, memoryService, current, (next) => { stageRef.current = next; if (current()) setStage(next); });
      if (result.kind === "saved" && current()) {
        appToast.success(getMessage("vi", "memoryComposerPosted"));
        onPosted();
      }
    } catch {
      if (current()) appToast.error(getMessage("vi", stageRef.current === "uploading" ? "memoryComposerUploadFailed" : "memoryComposerPostFailed"));
    } finally {
      posting.current = false;
      if (current()) setStage(null);
    }
  };

  const shownPhoto = preview ?? photo;
  return <AppSheet open={open} fitContent onOpenChange={(next) => { if (!next) close(); }} onAfterClose={onAfterClose} blurTarget={blurTarget} dismissible={stage === null}
    onBodyHeightChange={setBodyHeight}
    title={getMessage("vi", "memoryComposerTitle")} titleAlign="center" disableDrag
    footer={<YStack gap="$sm">
        {stage ? <Text role="status" fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", stage === "uploading" ? "memoryComposerUploading" : "memoryComposerPosting")}</Text>
          : frozen ? <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "memoryComposerRetryHint")}</Text> : null}
      <XStack justifyContent="flex-end" gap="$sm">
          <AppButton variant="ghost" disabled={stage !== null} onPress={close}>{getMessage("vi", "cancel")}</AppButton>
          <AppButton loading={stage !== null} disabled={busy || !coupleId || (!text.trim() && !photo)} onPress={() => void post()}>{getMessage("vi", frozen && stage === null ? "retry" : "memoryComposerPost")}</AppButton>
      </XStack>
    </YStack>}>
    <AppField id="memory-composer-text" multiline showLabel={false} label={getMessage("vi", "memoryComposerDescription")}
      placeholder={getMessage("vi", "memoryComposerPlaceholder")} value={text} onChangeText={setText} maxLength={200} editable={!frozen && !busy} />
    <AppPhotoPicker uri={shownPhoto?.uri ?? null} imageWidth={shownPhoto?.width} imageHeight={shownPhoto?.height} busy={busy} disabled={frozen}
      maxPreviewHeight={bodyHeight ? Math.max(1, bodyHeight - buttonTokens.height - spacing.sm * 2) : undefined}
      label={getMessage("vi", photo ? "memoryComposerChangePhoto" : "memoryComposerAddPhoto")}
      removeLabel={getMessage("vi", "memoryComposerRemovePhoto")} hint={getMessage("vi", "memoryComposerPhotoHint")}
      onPress={() => void selectPhoto()} onRemove={removePhoto} />
    {error ? <Text role="alert" fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$accentText">{getMessage("vi", error === "denied" ? "memoryComposerPermission" : "memoryComposerPhotoError")}</Text> : null}
  </AppSheet>;
}
