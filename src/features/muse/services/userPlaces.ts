import { supabase } from '@/lib/supabase';
import { saveUserHomeLocation } from '@/features/auth/userProfile';

import { geocodeQueryCandidates, resolveLiveWeather } from './liveWeather';
import { detectNetworkCountry } from './regionHint';

export type PlaceKind = 'home' | 'work' | 'uni' | 'trip' | 'other';

export type UserPlace = {
  id: string;
  kind: PlaceKind;
  label: string;
  query_name: string;
  nickname: string | null;
  notes: string | null;
  for_date: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** @deprecated kinds are no longer shown in UI — new places use `other`. */
export const PLACE_KIND_LABELS: Record<PlaceKind, string> = {
  home: 'Home',
  work: 'Work',
  uni: 'Uni',
  trip: 'Trip',
  other: 'Place',
};

const PLACE_SELECT =
  'id, kind, label, query_name, nickname, notes, for_date, latitude, longitude, is_active, created_at, updated_at';

function shortQueryName(raw: string): string {
  return geocodeQueryCandidates(raw)[0] ?? raw.trim();
}

function asPlace(row: unknown): UserPlace {
  return row as UserPlace;
}

async function resolveCoords(
  name: string,
  countryHint?: string | null,
): Promise<{
  latitude: number;
  longitude: number;
  label: string;
  queryName: string;
}> {
  // Bias only from caller / current network — never a fixed country.
  const networkCountry = countryHint ?? (await detectNetworkCountry());
  const live = await resolveLiveWeather(name, null, networkCountry);
  if (live.source !== 'live') {
    throw new Error(live.reason || `Could not find “${name}” on the map.`);
  }
  return {
    latitude: live.latitude,
    longitude: live.longitude,
    label: live.label,
    queryName: shortQueryName(live.label),
  };
}

export async function listUserPlaces(userId: string): Promise<UserPlace[]> {
  const { data, error } = await supabase
    .from('muse_user_places')
    .select(PLACE_SELECT)
    .eq('user_id', userId)
    .order('is_active', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(asPlace);
}

export async function getActivePlace(userId: string): Promise<UserPlace | null> {
  const { data, error } = await supabase
    .from('muse_user_places')
    .select(PLACE_SELECT)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data ? asPlace(data) : null;
}

async function clearActive(userId: string) {
  const { error } = await supabase
    .from('muse_user_places')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) throw error;
}

export async function setActivePlace(
  userId: string,
  placeId: string,
): Promise<UserPlace> {
  await clearActive(userId);
  const { data, error } = await supabase
    .from('muse_user_places')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', placeId)
    .eq('user_id', userId)
    .select(PLACE_SELECT)
    .single();
  if (error) throw error;
  const place = asPlace(data);
  await saveUserHomeLocation(userId, place.query_name || place.label).catch(
    () => undefined,
  );
  return place;
}

export async function deleteUserPlace(
  userId: string,
  placeId: string,
): Promise<void> {
  const { error } = await supabase
    .from('muse_user_places')
    .delete()
    .eq('id', placeId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function createUserPlace(input: {
  userId: string;
  name: string;
  kind?: PlaceKind;
  nickname?: string | null;
  notes?: string | null;
  forDate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  makeActive?: boolean;
}): Promise<UserPlace> {
  const raw = input.name.trim();
  if (raw.length < 2) throw new Error('Enter a place name');

  let latitude = input.latitude ?? null;
  let longitude = input.longitude ?? null;
  let queryName = shortQueryName(raw);
  let label = raw;

  const hasPin =
    latitude != null &&
    longitude != null &&
    !(latitude === 0 && longitude === 0);

  if (!hasPin) {
    const resolved = await resolveCoords(raw);
    latitude = resolved.latitude;
    longitude = resolved.longitude;
    label = resolved.label;
    queryName = resolved.queryName;
  }

  if (input.makeActive !== false) {
    await clearActive(input.userId);
  }

  const { data, error } = await supabase
    .from('muse_user_places')
    .insert({
      user_id: input.userId,
      kind: input.kind ?? 'other',
      label,
      query_name: queryName,
      nickname: input.nickname?.trim() || raw,
      notes: input.notes?.trim() || null,
      for_date: input.forDate?.trim() || null,
      latitude,
      longitude,
      is_active: input.makeActive !== false,
    })
    .select(PLACE_SELECT)
    .single();
  if (error) throw error;

  const place = asPlace(data);
  if (place.is_active) {
    await saveUserHomeLocation(input.userId, place.query_name || place.label).catch(
      () => undefined,
    );
  }
  return place;
}

/** @deprecated use createUserPlace */
export async function upsertUserPlace(input: {
  userId: string;
  kind?: PlaceKind;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  makeActive?: boolean;
}): Promise<UserPlace> {
  return createUserPlace(input);
}

export async function updateUserPlace(input: {
  userId: string;
  placeId: string;
  kind?: PlaceKind;
  name?: string;
  nickname?: string | null;
  notes?: string | null;
  forDate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<UserPlace> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.kind) patch.kind = input.kind;
  if (input.notes !== undefined) {
    patch.notes = input.notes?.trim() || null;
  }
  if (input.forDate !== undefined) {
    patch.for_date = input.forDate?.trim() || null;
  }

  if (input.name?.trim()) {
    const raw = input.name.trim();
    patch.nickname = raw;
    patch.label = raw;
    patch.query_name = shortQueryName(raw);
  } else if (input.nickname !== undefined) {
    patch.nickname = input.nickname?.trim() || null;
  }

  if (
    input.latitude != null &&
    input.longitude != null &&
    !(input.latitude === 0 && input.longitude === 0)
  ) {
    patch.latitude = input.latitude;
    patch.longitude = input.longitude;
  }

  const { data, error } = await supabase
    .from('muse_user_places')
    .update(patch)
    .eq('id', input.placeId)
    .eq('user_id', input.userId)
    .select(PLACE_SELECT)
    .single();
  if (error) throw error;

  const place = asPlace(data);
  if (place.is_active) {
    await saveUserHomeLocation(input.userId, place.query_name || place.label).catch(
      () => undefined,
    );
  }
  return place;
}

/** Ensure detected GPS/IP place exists and is active. */
export async function ensureDetectedPlace(input: {
  userId: string;
  label: string;
  latitude: number;
  longitude: number;
}): Promise<UserPlace> {
  const queryName = shortQueryName(input.label);
  const existing = await listUserPlaces(input.userId);
  const match = existing.find(
    (place) =>
      place.query_name.toLowerCase() === queryName.toLowerCase() ||
      (place.latitude != null &&
        place.longitude != null &&
        Math.abs(place.latitude - input.latitude) < 0.02 &&
        Math.abs(place.longitude - input.longitude) < 0.02),
  );
  if (match) {
    if (!match.is_active) return setActivePlace(input.userId, match.id);
    return match;
  }
  return createUserPlace({
    userId: input.userId,
    name: queryName,
    latitude: input.latitude,
    longitude: input.longitude,
    makeActive: true,
  });
}

export function placeChipLabel(place: UserPlace): string {
  const name =
    place.nickname?.trim() ||
    place.label.split(',')[0]?.trim() ||
    place.label;
  if (place.for_date) {
    const when = formatPlaceDate(place.for_date);
    return when ? `${name} · ${when}` : name;
  }
  return name;
}

export function formatPlaceDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (!match) return isoDate;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** YYYY-MM-DD for N days from today (local). */
export function localDatePlusDays(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
