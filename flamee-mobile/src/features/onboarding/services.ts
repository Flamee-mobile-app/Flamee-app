import { authService } from "../auth";
import { createOnboardingApi } from "./onboardingApi";
import { createOnboardingService } from "./onboardingServiceCore";

export const onboardingService = createOnboardingService(createOnboardingApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "" }), authService);
