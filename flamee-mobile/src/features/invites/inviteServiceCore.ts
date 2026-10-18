import type { AuthService } from "../auth/authService.ts";
import type { InviteApi } from "./inviteApi.ts";

export function createInviteService(api: InviteApi, auth: Pick<AuthService, "withAccessToken">) {
  return {
    connection: () => auth.withAccessToken(api.connection),
    create: () => auth.withAccessToken(api.create),
    current: () => auth.withAccessToken(api.current),
    revoke: () => auth.withAccessToken(api.revoke),
    preview: (code: string) => auth.withAccessToken((token) => api.preview(token, code)),
    accept: (code: string) => auth.withAccessToken((token) => api.accept(token, code)),
  };
}
