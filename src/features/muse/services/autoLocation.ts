import * as Location from 'expo-location';

import { geocodeQueryCandidates } from './liveWeather';

export type AutoPlace = {
  label: string;
  latitude: number;
  longitude: number;
  source: 'profile' | 'device' | 'ip';
};

function formatPlace(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(', ');
}

function shortLabel(raw: string): string {
  return geocodeQueryCandidates(raw)[0] ?? raw.trim();
}

async function labelFromCoords(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const rows = await Location.reverseGeocodeAsync({ latitude, longitude });
    const hit = rows[0];
    if (hit) {
      // Prefer city/district only — long admin strings break Open-Meteo search.
      const city =
        hit.city || hit.subregion || hit.district || hit.name || hit.region;
      if (city?.trim()) return shortLabel(city);
    }
  } catch {
    // fall through
  }
  return null;
}

async function fromDevice(): Promise<AutoPlace | null> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    let status = current.status;
    if (status !== Location.PermissionStatus.GRANTED) {
      const asked = await Location.requestForegroundPermissionsAsync();
      status = asked.status;
    }
    if (status !== Location.PermissionStatus.GRANTED) return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = position.coords;
    const label = await labelFromCoords(latitude, longitude);
    if (!label) return null;
    return { label, latitude, longitude, source: 'device' };
  } catch {
    return null;
  }
}

/** Approximate city from public IP — works even if GPS permission is denied. */
async function fromIp(): Promise<AutoPlace | null> {
  try {
    const res = await fetch('https://ipwho.is/');
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success?: boolean;
      city?: string;
      region?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
    };
    if (json.success === false) return null;
    if (typeof json.latitude !== 'number' || typeof json.longitude !== 'number') {
      return null;
    }
    const label =
      shortLabel(json.city || '') ||
      shortLabel(formatPlace([json.city, json.region, json.country])) ||
      (await labelFromCoords(json.latitude, json.longitude));
    if (!label) return null;
    return {
      label,
      latitude: json.latitude,
      longitude: json.longitude,
      source: 'ip',
    };
  } catch {
    return null;
  }
}

/**
 * Resolve where the user is for Muse weather.
 * Profile city → device GPS → IP city. Never invents a place.
 */
export async function resolveAutoPlace(
  profileLocation?: string | null,
): Promise<AutoPlace | null> {
  const saved = profileLocation?.trim();
  if (saved) {
    return {
      label: shortLabel(saved),
      latitude: 0,
      longitude: 0,
      source: 'profile',
    };
  }

  const device = await fromDevice();
  if (device) return device;

  return fromIp();
}
