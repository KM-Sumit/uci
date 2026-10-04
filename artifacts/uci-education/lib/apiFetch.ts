import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "uci-access-token";

async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof globalThis.sessionStorage === "undefined"
      ? null
      : globalThis.sessionStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

const API_BASE =
  process.env.EXPO_PUBLIC_DOMAIN
    ? process.env.EXPO_PUBLIC_DOMAIN.startsWith("http")
      ? process.env.EXPO_PUBLIC_DOMAIN
      : `http://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "http://10.229.196.10:5000";

/**
 * Authenticated fetch helper for admin forms.
 * Attaches the stored JWT bearer token automatically.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    const msg =
      (data as any)?.message ?? `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(msg);
  }

  return data as T;
}
