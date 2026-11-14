import { authService } from "../auth/authRuntime.ts";
import { createInviteApi } from "./inviteApi.ts";
import { createInviteService } from "./inviteServiceCore.ts";

const api = createInviteApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "" });
export const inviteService = createInviteService(api, authService);
