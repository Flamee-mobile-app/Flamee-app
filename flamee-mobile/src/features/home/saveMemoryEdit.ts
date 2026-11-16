import type { MemoryDetail, MemoryUpload, MemoryUploadFile, MemoryUpdateInput } from "../moments/memoryApi.ts";

export type MemoryEditCheckpoint = { uploaded?: MemoryUpload; removed?: boolean };
/** Upload first; never discard the old photo before the new one is acknowledged. */
export async function saveMemoryEdit(input: { id: string; payload: MemoryUpdateInput; photo: MemoryUploadFile | null; removeImageId: string | null; requestKey: string; checkpoint: MemoryEditCheckpoint }, api: {
  upload: (id: string, file: MemoryUploadFile, key: string) => Promise<MemoryUpload>;
  removeImage: (id: string, imageId: string) => Promise<void>;
  detail: (id: string) => Promise<MemoryDetail>;
  update: (id: string, payload: MemoryUpdateInput) => Promise<MemoryDetail>;
}, current: () => boolean): Promise<MemoryDetail> {
  const check = () => { if (!current()) throw new Error("cancelled"); };
  check();
  if (input.photo && !input.checkpoint.uploaded) {
    const uploaded = await api.upload(input.id, input.photo, input.requestKey);
    check(); input.checkpoint.uploaded = uploaded;
  }
  if (input.removeImageId && !input.checkpoint.removed) {
    check();
    try { await api.removeImage(input.id, input.removeImageId); }
    catch (error) {
      check();
      // A timeout may follow a committed delete. Verify through the authorized API.
      const latest = await api.detail(input.id);
      if (latest.id !== input.id || latest.images.some((image) => image.id === input.removeImageId)) throw error;
    }
    check(); input.checkpoint.removed = true;
  }
  check();
  const saved = await api.update(input.id, input.payload);
  check();
  if (saved.id !== input.id) throw new Error("Mismatched memory acknowledgement");
  return saved;
}
