import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * LAN IP of the machine running Metro / Nest / Muse.
 * Prefer Expo Go’s live debugger host so Wi‑Fi DHCP changes don’t break the phone.
 */
export function resolveDevHost(): string {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest
      ?.debuggerHost,
    Constants.linkingUri,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = String(candidate).match(/(\d{1,3}(?:\.\d{1,3}){3})/);
    const ip = match?.[1];
    if (ip && ip !== '127.0.0.1') {
      return ip;
    }
  }

  const explicit = process.env.EXPO_PUBLIC_DEV_HOST?.trim();
  if (explicit) {
    return explicit.replace(/^https?:\/\//, '').split(':')[0] ?? explicit;
  }

  // Android emulator → host loopback
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }
  return '127.0.0.1';
}

/** Nest API base. Live Expo host wins over stale EXPO_PUBLIC_API_URL. */
export function nestDevBaseUrl(): string {
  const host = resolveDevHost();
  if (host !== '127.0.0.1' && host !== '10.0.2.2') {
    return `http://${host}:3000`;
  }
  const override = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (override) {
    return override.replace(/\/$/, '');
  }
  return `http://${host}:3000`;
}

/** Muse Node API base. Live Expo host wins over stale EXPO_PUBLIC_MUSE_URL. */
export function museDevBaseUrl(): string {
  const host = resolveDevHost();
  if (host !== '127.0.0.1' && host !== '10.0.2.2') {
    return `http://${host}:8787`;
  }
  const override = process.env.EXPO_PUBLIC_MUSE_URL?.trim();
  if (override) {
    return override.replace(/\/$/, '');
  }
  return `http://${host}:8787`;
}
