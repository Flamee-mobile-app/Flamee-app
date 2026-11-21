import { authService } from "../auth";
import { useSessionStore } from "../../shared/state/sessionStore";
import { createConversationApi } from "./conversationApi";

const api = createConversationApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "" });
export type ConversationScope = { accountId: string | null; coupleId: string | null; sessionId: number; revision: number };
export function conversationScope(): ConversationScope {
  const state = useSessionStore.getState();
  return { accountId: state.activeAccountId, coupleId: state.activeCoupleId, sessionId: state.sessionId, revision: state.membershipRevision };
}
export function conversationCurrent(scope: ConversationScope) {
  const next = conversationScope();
  return !!scope.accountId && !!scope.coupleId && scope.accountId === next.accountId && scope.coupleId === next.coupleId && scope.sessionId === next.sessionId && scope.revision === next.revision;
}
async function scoped<T>(scope: ConversationScope, action: (token: string) => Promise<T>) {
  const check = () => { if (!conversationCurrent(scope)) { const error = new Error("Scope changed"); error.name = "AbortError"; throw error; } };
  check();
  const result = await authService.withAccessToken(async (token) => { check(); return action(token); });
  check(); return result;
}
export const conversationKeys = {
  scope: (scope: ConversationScope) => ["conversations", scope.sessionId, scope.accountId, scope.coupleId, scope.revision] as const,
  comments: (scope: ConversationScope, id: string) => [...conversationKeys.scope(scope), "comments", id] as const,
  inbox: (scope: ConversationScope) => [...conversationKeys.scope(scope), "inbox"] as const,
};
export const conversationService = {
  postHeart: (scope: ConversationScope, id: string, desired?: boolean, signal?: AbortSignal) => scoped(scope, (token) => api.postHeart(token, id, desired, signal)),
  list: (scope: ConversationScope, id: string, offset: number, signal?: AbortSignal) => scoped(scope, (token) => api.list(token, id, offset, signal)),
  comment: (scope: ConversationScope, id: string, commentId: string, signal?: AbortSignal) => scoped(scope, (token) => api.comment(token, id, commentId, signal)),
  send: (scope: ConversationScope, id: string, body: string, parentId: string | null, key: string) => scoped(scope, (token) => api.send(token, id, body, parentId, key)),
  edit: (scope: ConversationScope, id: string, commentId: string, body: string, version: number) => scoped(scope, (token) => api.edit(token, id, commentId, body, version)),
  remove: (scope: ConversationScope, id: string, commentId: string, version: number) => scoped(scope, (token) => api.remove(token, id, commentId, version)),
  heart: (scope: ConversationScope, id: string, commentId: string, desired: boolean) => scoped(scope, (token) => api.heart(token, id, commentId, desired)),
  inbox: (scope: ConversationScope, offset: number, signal?: AbortSignal) => scoped(scope, (token) => api.inbox(token, offset, signal)),
  read: (scope: ConversationScope, id?: string) => scoped(scope, (token) => api.read(token, id)),
};
