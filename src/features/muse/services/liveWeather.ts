import type { MuseWeather } from './museApi';

type GeoHit = {
  latitude: number;
  longitude: number;
  name?: string;
  admin1?: string;
  country?: string;
};

export type PlaceCoords = {
  latitude: number;
  longitude: number;
  label?: string;
};

export type LiveWeatherResult =
  | {
      weather: MuseWeather;
      source: 'live';
      label: string;
      latitude: number;
      longitude: number;
    }
  | {
      weather: null;
      source: 'unavailable';
      label?: string;
      reason: string;
    };

/** WMO weather interpretation codes → Muse dressing condition. */
function conditionFromWmo(code: number | undefined): MuseWeather['condition'] {
  if (code == null) return undefined;
  if (code === 0 || code === 1 || code === 2) return 'clear';
  if (code === 3 || code === 45 || code === 48) return 'cloudy';
  if (code >= 71 && code <= 77) return 'snow';
  if (code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) {
    return 'rain';
  }
  return 'clear';
}

function placeLabel(hit: GeoHit, fallback: string): string {
  // Short, geocode-friendly label (city first) — avoid long admin strings.
  return hit.name?.trim() || fallback.split(',')[0]?.trim() || fallback;
}

/** Progressive name candidates — long reverse-geocode strings often miss. */
export function geocodeQueryCandidates(raw: string): string[] {
  const query = raw.trim();
  if (!query) return [];
  const parts = query
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const out: string[] = [];
  const push = (value: string) => {
    const cleaned = value.replace(/\s+/g, ' ').trim();
    if (cleaned.length >= 2 && !out.includes(cleaned)) out.push(cleaned);
  };
  push(query);
  if (parts[0]) push(parts[0]);
  if (parts.length >= 2) push(`${parts[0]} ${parts[parts.length - 1]}`);
  if (parts.length >= 2) push(`${parts[0]}, ${parts[parts.length - 1]}`);
  // Drop "Governorate" / noisy admin tokens
  for (const part of parts) {
    if (!/governorate|district|province|region/i.test(part)) push(part);
  }
  return out;
}

type GeoHitRich = GeoHit & {
  country?: string;
  country_code?: string;
  admin1?: string;
};

function pickGeoHit(
  rows: GeoHitRich[],
  candidate: string,
  regionHints: string[] = [],
): GeoHitRich | null {
  if (!rows.length) return null;
  const needle = candidate.toLowerCase();
  const hints = regionHints
    .map((h) => h.trim().toLowerCase())
    .filter((h) => h.length >= 2);
  const scored = [...rows].sort((a, b) => {
    const score = (row: GeoHitRich) => {
      let s = 0;
      const name = row.name?.toLowerCase() ?? '';
      const country = row.country?.toLowerCase() ?? '';
      const code = row.country_code?.toLowerCase() ?? '';
      const admin = row.admin1?.toLowerCase() ?? '';
      if (name === needle) s += 40;
      else if (name.includes(needle.split(/\s+/)[0] ?? needle)) s += 15;
      for (const hint of hints) {
        if (country === hint || code === hint) s += 50;
        else if (country.includes(hint) || hint.includes(country)) s += 30;
        if (admin.includes(hint)) s += 10;
      }
      return s;
    };
    return score(b) - score(a);
  });
  return scored[0] ?? null;
}

async function geocode(
  query: string,
  regionHints: string[] = [],
): Promise<GeoHitRich | null> {
  // Soft hints from the query itself (e.g. "Faraya, Lebanon" / "Passy, Paris").
  const fromQuery = geocodeQueryCandidates(query).slice(1);
  const hints = [...regionHints, ...fromQuery];
  for (const candidate of geocodeQueryCandidates(query)) {
    const geoUrl =
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidate)}` +
      `&count=8&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) continue;
    const geoJson = (await geoRes.json()) as { results?: GeoHitRich[] };
    const hit = pickGeoHit(geoJson.results ?? [], candidate, hints);
    if (hit) return hit;
  }
  return null;
}

async function forecastAt(
  latitude: number,
  longitude: number,
  label: string,
): Promise<LiveWeatherResult> {
  const wxUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
    `&longitude=${longitude}&current=temperature_2m,weather_code`;
  const wxRes = await fetch(wxUrl);
  if (!wxRes.ok) {
    return {
      weather: null,
      source: 'unavailable',
      label,
      reason: 'Weather service unavailable.',
    };
  }
  const wxJson = (await wxRes.json()) as {
    current?: { temperature_2m?: number; weather_code?: number };
  };
  const temp = wxJson.current?.temperature_2m;
  if (typeof temp !== 'number') {
    return {
      weather: null,
      source: 'unavailable',
      label,
      reason: 'No current temperature from weather service.',
    };
  }

  const condition = conditionFromWmo(wxJson.current?.weather_code);
  const dressedCondition =
    temp <= 8 && condition !== 'rain' && condition !== 'snow'
      ? 'cold'
      : condition;

  return {
    weather: {
      temperature_c: Math.round(temp),
      ...(dressedCondition ? { condition: dressedCondition } : {}),
    },
    source: 'live',
    label,
    latitude,
    longitude,
  };
}

/**
 * Live weather via coords (preferred) or place name.
 * Never invents temperature/condition.
 */
export async function resolveLiveWeather(
  location: string | null | undefined,
  coords?: PlaceCoords | null,
  countryHint?: string | null,
): Promise<LiveWeatherResult> {
  const labelHint = coords?.label?.trim() || location?.trim() || '';

  if (
    coords &&
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude) &&
    !(coords.latitude === 0 && coords.longitude === 0)
  ) {
    try {
      return await forecastAt(
        coords.latitude,
        coords.longitude,
        labelHint || `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`,
      );
    } catch {
      return {
        weather: null,
        source: 'unavailable',
        label: labelHint || undefined,
        reason: 'Could not reach live weather.',
      };
    }
  }

  const query = location?.trim();
  if (!query) {
    return {
      weather: null,
      source: 'unavailable',
      reason: 'Add a place to use live weather.',
    };
  }

  try {
    const hints = countryHint?.trim() ? [countryHint.trim()] : [];
    const hit = await geocode(query, hints);
    if (!hit) {
      return {
        weather: null,
        source: 'unavailable',
        label: query.split(',')[0]?.trim() || query,
        reason: `Could not find “${query.split(',')[0]?.trim() || query}” on the map.`,
      };
    }
    return await forecastAt(
      hit.latitude,
      hit.longitude,
      placeLabel(hit, query),
    );
  } catch {
    return {
      weather: null,
      source: 'unavailable',
      label: query.split(',')[0]?.trim() || query,
      reason: 'Could not reach live weather.',
    };
  }
}

export type LiveDayForecast = {
  date: string;
  weather: MuseWeather;
};

/** Next N days from Open-Meteo for travel packing — no invented rain days. */
export async function resolveLiveForecast(
  location: string | null | undefined,
  days = 7,
  coords?: PlaceCoords | null,
): Promise<{ label?: string; days: LiveDayForecast[]; reason?: string }> {
  const live = await resolveLiveWeather(location, coords);
  if (live.source !== 'live') {
    return { days: [], reason: live.reason, label: live.label };
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${live.latitude}` +
      `&longitude=${live.longitude}` +
      `&daily=weather_code,temperature_2m_max&forecast_days=${Math.min(16, Math.max(1, days))}` +
      `&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        label: live.label,
        days: [
          {
            date: new Date().toISOString().slice(0, 10),
            weather: live.weather,
          },
        ],
        reason: 'Daily forecast unavailable — using current conditions only.',
      };
    }
    const json = (await res.json()) as {
      daily?: {
        time?: string[];
        weather_code?: number[];
        temperature_2m_max?: number[];
      };
    };
    const times = json.daily?.time ?? [];
    const codes = json.daily?.weather_code ?? [];
    const temps = json.daily?.temperature_2m_max ?? [];
    const out: LiveDayForecast[] = [];
    for (let i = 0; i < times.length; i += 1) {
      const temp = temps[i];
      if (typeof temp !== 'number') continue;
      const condition = conditionFromWmo(codes[i]);
      const dressed =
        temp <= 8 && condition !== 'rain' && condition !== 'snow'
          ? 'cold'
          : condition;
      out.push({
        date: times[i]!,
        weather: {
          temperature_c: Math.round(temp),
          ...(dressed ? { condition: dressed } : {}),
        },
      });
    }
    return { label: live.label, days: out };
  } catch {
    return {
      label: live.label,
      days: [{ date: new Date().toISOString().slice(0, 10), weather: live.weather }],
      reason: 'Daily forecast failed — using current conditions only.',
    };
  }
}
