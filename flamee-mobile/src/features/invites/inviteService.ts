import { authService } from "../auth/authRuntime.ts";
import { createInviteApi } from "./inviteApi.ts";

const api = createInviteApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "" });
const token = () => {
  const value = authService.getAccessToken();
  if (!value) throw new Error("unauthorized");
  return value;
};

export const inviteService = {
  create: () => api.create(token()),
  current: () => api.current(token()),
  revoke: () => api.revoke(token()),
  preview: (code: string) => api.preview(token(), code),
  accept: (code: string) => api.accept(token(), code),
};
