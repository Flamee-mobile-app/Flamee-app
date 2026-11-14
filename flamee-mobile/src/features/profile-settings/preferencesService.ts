import { authService } from "../auth";
import { createPreferencesApi } from "./preferencesApi";
import { createPreferencesService } from "./preferencesServiceCore";

export const preferencesService = createPreferencesService(createPreferencesApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "" }), authService);
