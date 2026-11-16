import type { InfiniteData } from "@tanstack/react-query";
import type { z } from "zod";
import type { commentsSchema, MemoryComment } from "./conversationApi.ts";
export type CommentPage = z.infer<typeof commentsSchema>;

/** Profile's username field stores the user's chosen nickname. */
export function getCommentAuthorName(author: MemoryComment["author"]) {
  return author.username?.trim() || author.full_name.trim();
}

export function getReplyAuthorName(comment: MemoryComment, comments: readonly MemoryComment[]) {
  const parent = comments.find((item) => item.id === comment.parent_id);
  return parent ? getCommentAuthorName(parent.author) : comment.parent_author?.trim() || "…";
}

export function getCommentActions(comment: MemoryComment, accountId: string | null) {
  if (comment.deleted) return [];
  return ["heart", ...(!comment.parent_id ? ["reply"] : []), ...(comment.author.id === accountId ? ["edit", "delete"] : [])] as ("heart" | "reply" | "edit" | "delete")[];
}

export function mergeCommentAcknowledgement(data: InfiniteData<CommentPage, number> | undefined, comment: MemoryComment, insert: boolean) {
  if (!data) return data;
  const exists = data.pages.some((page) => page.items.some((item) => item.id === comment.id));
  return { ...data, pages: data.pages.map((page, index) => ({ ...page, items: insert && !exists && index === 0 ? [comment, ...page.items] : page.items.map((item) => item.id === comment.id ? comment : item) })) };
}

export function orderCommentThreads(comments: MemoryComment[]) {
  const compare = (a: MemoryComment, b: MemoryComment) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);
  const roots = comments.filter((item) => !item.parent_id).sort(compare);
  const rootIds = new Set(roots.map((item) => item.id));
  const replies = new Map<string, MemoryComment[]>();
  for (const item of comments) if (item.parent_id && rootIds.has(item.parent_id)) replies.set(item.parent_id, [...replies.get(item.parent_id) ?? [], item]);
  // A paginated parent may not be loaded yet; the server-supplied parent_author
  // still identifies the reply without inventing a parent body.
  const anchors = [...roots, ...comments.filter((item) => item.parent_id && !rootIds.has(item.parent_id))].sort(compare);
  return anchors.flatMap((item) => [item, ...(replies.get(item.id) ?? []).sort(compare)]);
}
