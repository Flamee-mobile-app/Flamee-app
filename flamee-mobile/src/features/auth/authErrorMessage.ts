import { getMessage, type MessageKey } from "../../shared/localization/messages.ts";
import { AuthError, type AuthErrorCode } from "./authApi.ts";

const copy: Record<AuthErrorCode, MessageKey> = {
  configuration: "authConfigurationError",
  network: "authNetworkError",
  timeout: "authTimeoutError",
  credentials: "authCredentialsError",
  duplicateEmail: "authDuplicateEmailError",
  validation: "authValidationError",
  server: "authServerError",
  response: "authServerError",
  storage: "authStorageError",
  cancelled: "authServerError",
};

export function getAuthErrorMessage(error: unknown): string {
  return getMessage("vi", error instanceof AuthError ? copy[error.code] : "authServerError");
}
