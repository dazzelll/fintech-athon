import Constants from "expo-constants";
import { Platform } from "react-native";

function getDevHostFromExpo(): string | null {
  // `hostUri` is usually like "192.168.1.20:8081" in Expo dev.
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any)?.manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== "string") return null;
  const host = hostUri.split(":")[0];
  return host || null;
}

function normalizeBase(base: string): string {
  return base.replace(/\/+$/, "");
}

/**
 * Configure with env when needed:
 * - Web:  EXPO_PUBLIC_API_BASE_URL="http://localhost:8000/api"
 * - Phone (LAN): EXPO_PUBLIC_API_BASE_URL="http://<your-ip>:8000/api"
 */
export const API_BASE_URL = (() => {
  const env = (process.env.EXPO_PUBLIC_API_BASE_URL || "").trim();
  if (env) return normalizeBase(env);

  // Web runs on the same machine as the backend most of the time.
  if (Platform.OS === "web") return "http://localhost:8000/api";

  // Android emulator talks to host machine via 10.0.2.2.
  if (Platform.OS === "android") return "http://10.0.2.2:8000/api";

  // iOS simulator (and some native dev setups) can use localhost.
  // For real devices, derive the host from Expo's dev server so it hits your LAN IP.
  const inferredHost = getDevHostFromExpo();
  if (inferredHost) return `http://${inferredHost}:8000/api`;

  return "http://localhost:8000/api";
})();

