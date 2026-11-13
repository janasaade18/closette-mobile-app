import type { MuseWeather } from './museApi';

/** Default when live weather is unavailable — matches home / Muse presets. */
export const FALLBACK_WEATHER: MuseWeather = {
  temperature_c: 18,
  condition: 'rain',
};

type GeoHit = { latitude: number; longitude: number; name?: string };

function conditionFromWmo(code: number | undefined): MuseWeather['condition'] {
  if (code == null) return 'clear';
  if (code >= 71 && code <= 77) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code === 95) {
    return 'rain';
  }
  if (code >= 1 && code <= 3) return 'cloudy';
  return 'clear';
}

/**
 * Resolve current weather for the user's onboarding location via Open-Meteo (no API key).
 * Falls back quietly when offline or location is missing.
 */
export async function resolveLiveWeather(
  location: string | null | undefined,
): Promise<{ weather: MuseWeather; source: 'live' | 'fallback'; label?: string }> {
  const query = location?.trim();
  if (!query) {
    return { weather: FALLBACK_WEATHER, source: 'fallback' };
  }

  try {
    const geoUrl =
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}` +
      `&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) return { weather: FALLBACK_WEATHER, source: 'fallback' };
    const geoJson = (await geoRes.json()) as { results?: GeoHit[] };
    const hit = geoJson.results?.[0];
    if (!hit) return { weather: FALLBACK_WEATHER, source: 'fallback' };

    const wxUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}` +
      `&longitude=${hit.longitude}&current=temperature_2m,weather_code`;
    const wxRes = await fetch(wxUrl);
    if (!wxRes.ok) return { weather: FALLBACK_WEATHER, source: 'fallback' };
    const wxJson = (await wxRes.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const temp = wxJson.current?.temperature_2m;
    if (typeof temp !== 'number') {
      return { weather: FALLBACK_WEATHER, source: 'fallback' };
    }

    return {
      weather: {
        temperature_c: Math.round(temp),
        condition: conditionFromWmo(wxJson.current?.weather_code),
      },
      source: 'live',
      label: hit.name,
    };
  } catch {
    return { weather: FALLBACK_WEATHER, source: 'fallback' };
  }
}
