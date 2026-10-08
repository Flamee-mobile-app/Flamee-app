import { ApiError, errorCodeForStatus } from "./apiError";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) throw new ApiError("unknown", null, "API URL is not configured.");

  let response: Response;
  try {
      const url = `${API_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
      response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("network", null);
  }

  if (!response.ok) throw new ApiError(errorCodeForStatus(response.status), response.status);
  if (response.status === 204) return undefined as T;
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("invalid_response", response.status);
  }
}
