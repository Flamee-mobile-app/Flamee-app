import { MemoryApiError, type MemoryCreateInput, type MemoryCreated, type MemoryUpload, type MemoryUploadFile } from "./memoryApi.ts";

export type MemoryPostStage = "creating" | "uploading";
/** In-memory acknowledgements belonging to one frozen draft and session scope. */
export type MemoryPostCheckpoint = { created?: MemoryCreated; uploaded?: MemoryUpload };

export async function publishMemoryPost(input: { accountId: string; requestKey: string; payload: MemoryCreateInput; photo: MemoryUploadFile | null; checkpoint?: MemoryPostCheckpoint }, dependencies: {
  create: (input: MemoryCreateInput, key: string) => Promise<MemoryCreated>;
  upload: (id: string, file: MemoryUploadFile, key: string) => Promise<MemoryUpload>;
}, current: () => boolean, onStage: (stage: MemoryPostStage) => void): Promise<{ kind: "saved"; id: string } | { kind: "cancelled" }> {
  if (!current()) return { kind: "cancelled" };
  if (input.checkpoint?.uploaded && !input.checkpoint.created) throw new MemoryApiError("response");
  let record = input.checkpoint?.created;
  if (!record) {
    onStage("creating");
    record = await dependencies.create(input.payload, input.requestKey);
  }
  if (!current()) return { kind: "cancelled" };
  if (record.created_by !== input.accountId) throw new MemoryApiError("response");
  if (input.checkpoint) input.checkpoint.created = record;
  if (input.photo && !input.checkpoint?.uploaded) {
    onStage("uploading");
    const uploaded = await dependencies.upload(record.id, input.photo, input.requestKey);
    if (!current()) return { kind: "cancelled" };
    if (input.checkpoint) input.checkpoint.uploaded = uploaded;
  }
  return { kind: "saved", id: record.id };
}
