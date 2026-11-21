import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isMemoryMutationScopeCurrent, memoryQueryKeys, memoryService, type MemoryDetail, type MemoryScope } from "../moments";
import { useSessionStore } from "../../shared/state/sessionStore";
import { reconcileMemoryEdit } from "./memoryEditModel";
import { randomUUID } from "expo-crypto";
import { localMediaAdapter } from "../media";
import { createMemoryPhotoDraft } from "./memoryPhotoDraft";
import { saveMemoryEdit, type MemoryEditCheckpoint } from "./saveMemoryEdit";
import { getMessage } from "../../shared/localization/messages";
import { appToast } from "../../shared/components/AppToast";

type Draft = { id: string; title: string; description: string; initialTitle: string; initialDescription: string; scopeKey: string; original: MemoryDetail["images"][number] | null; photoChanged: boolean };
export type InlineMemoryEditor = { id: string; title: string; description: string; busy: boolean; failed: boolean; dirty: boolean;
  setTitle: (value: string) => void; setDescription: (value: string) => void; save: () => Promise<void>; cancel: () => void };
export type MemoryPhotoEditor = { uri: string | null; width?: number; height?: number; picking: boolean; frozen: boolean; error: "denied" | "unavailable" | null; select: () => Promise<void>; remove: () => void };
export type MemoryPostEditor = InlineMemoryEditor & { photo: MemoryPhotoEditor };

/** Scoped draft stays above the sheet's virtualized rows; publish only server acknowledgements. */
export function useInlineMemoryEdit(scope: MemoryScope) {
  const client = useQueryClient();
  const key = JSON.stringify([scope.sessionId, scope.accountId, scope.coupleId]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  const photoDraft = useRef<ReturnType<typeof createMemoryPhotoDraft> | null>(null);
  const [photo, setPhoto] = useState<{ uri: string; width?: number; height?: number } | null>(null);
  const [preview, setPreview] = useState<{ uri: string; width?: number; height?: number } | null>(null);
  const [picking, setPicking] = useState(false);
  const pickingRef = useRef(false);
  const [photoError, setPhotoError] = useState<"denied" | "unavailable" | null>(null);
  const [frozen, setFrozen] = useState(false);
  const checkpoint = useRef<MemoryEditCheckpoint>({});
  const requestKey = useRef<string | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; void photoDraft.current?.dispose().catch(() => undefined); photoDraft.current = null; }; }, []);
  const reset = useCallback(() => {
    void photoDraft.current?.dispose().catch(() => undefined); photoDraft.current = null;
    setDraft(null); setFailed(false); setPhoto(null); setPreview(null); setPicking(false); setPhotoError(null); setFrozen(false);
    checkpoint.current = {}; requestKey.current = null;
  }, []);
  useEffect(() => { reset(); }, [key, reset]);
  const current = () => isMemoryMutationScopeCurrent(scope, useSessionStore.getState());
  const begin = useCallback((record: MemoryDetail) => {
    if (lock.current || !isMemoryMutationScopeCurrent(scope, useSessionStore.getState())) return;
    reset(); photoDraft.current = createMemoryPhotoDraft(localMediaAdapter);
    setDraft({ id: record.id, title: record.title, description: record.description ?? "", initialTitle: record.title, initialDescription: record.description ?? "", scopeKey: key, original: record.images[0] ?? null, photoChanged: false }); setFailed(false);
  }, [scope, key, reset]);
  const selectPhoto = async () => {
    const owner = photoDraft.current;
    if (!owner || lock.current || frozen || pickingRef.current || !current()) return;
    pickingRef.current = true; setPicking(true); setPhotoError(null);
    try {
      const result = await owner.select((asset) => { if (mounted.current && photoDraft.current === owner && current()) setPreview(asset); });
      if (!mounted.current || photoDraft.current !== owner || !current() || !result) return;
      if (result.kind === "selected") { setPhoto(result); setDraft((old) => old && ({ ...old, photoChanged: true })); }
      else if (result.kind !== "cancelled") setPhotoError(result.kind);
    } finally {
      pickingRef.current = false;
      if (mounted.current && photoDraft.current === owner) { setPicking(false); setPreview(null); }
    }
  };
  const removePhoto = () => {
    if (lock.current || frozen || pickingRef.current) return;
    void photoDraft.current?.remove().catch(() => undefined); setPhoto(null); setPreview(null); setPhotoError(null);
    setDraft((old) => old && ({ ...old, photoChanged: Boolean(old.original) }));
  };
  const save = async () => {
    if (!draft || draft.scopeKey !== key || lock.current || pickingRef.current || !current() || (!draft.title.trim() && !photo && !(draft.original && !draft.photoChanged)) || Array.from(draft.title.trim()).length > 200) return;
    const feedback = appToast.operation();
    feedback.loading(getMessage("vi", "memoryUpdating"));
    lock.current = true; setBusy(true); setFailed(false);
    try {
      await client.cancelQueries({ queryKey: memoryQueryKeys.scope(scope) });
      if (!current()) return;
      requestKey.current ??= randomUUID(); setFrozen(true);
      const saved = await saveMemoryEdit({ id: draft.id, payload: { title: draft.title.trim() || getMessage("vi", "memoryComposerDefaultTitle"), description: draft.description || null },
        photo: photo ? { uri: photo.uri, name: "memory.jpg", type: "image/jpeg" } : null,
        removeImageId: draft.photoChanged ? draft.original?.id ?? null : null, requestKey: requestKey.current, checkpoint: checkpoint.current,
      }, {
        upload: (id, file, uploadKey) => memoryService.uploadEditImage(scope, id, file, uploadKey),
        removeImage: (id, imageId) => memoryService.removeImage(scope, id, imageId),
        detail: memoryService.detail,
        update: (id, payload) => memoryService.update(scope, id, payload),
      }, current);
      if (!current()) return;
      if (saved.id !== draft.id) throw new Error("Mismatched memory acknowledgement");
      client.setQueryData(memoryQueryKeys.detail(scope, saved.id), saved);
      client.setQueryData(memoryQueryKeys.feed(scope), (old: Parameters<typeof reconcileMemoryEdit>[0]) => reconcileMemoryEdit(old, saved, draft.photoChanged));
      feedback.success(getMessage("vi", "memoryUpdated"));
      if (mounted.current) reset();
      void client.invalidateQueries({ queryKey: memoryQueryKeys.scope(scope) });
    } catch {
      if (current()) {
        feedback.error(getMessage("vi", "memoryActionError"));
        if (mounted.current) setFailed(true);
        void client.invalidateQueries({ queryKey: memoryQueryKeys.scope(scope) });
      }
    } finally { feedback.dismiss(); lock.current = false; if (mounted.current) setBusy(false); }
  };
  const shown = preview ?? photo ?? (draft && !draft.photoChanged && draft.original ? { uri: draft.original.url, width: draft.original.width ?? undefined, height: draft.original.height ?? undefined } : null);
  const editor: MemoryPostEditor | null = draft?.scopeKey === key ? {
    id: draft.id, title: draft.title, description: draft.description, busy: busy || picking, failed, save,
    dirty: draft.title !== draft.initialTitle || draft.description !== draft.initialDescription || draft.photoChanged,
    setTitle: (title) => setDraft((old) => old && !lock.current && !frozen ? { ...old, title } : old),
    setDescription: (description) => setDraft((old) => old && !lock.current && !frozen ? { ...old, description } : old),
    cancel: () => { if (!lock.current) reset(); },
    photo: { uri: shown?.uri ?? null, width: shown?.width, height: shown?.height, picking, frozen, error: photoError, select: selectPhoto, remove: removePhoto },
  } : null;
  return { editor, begin, reset };
}
