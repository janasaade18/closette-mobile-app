import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

import type { ClosetGarment } from '../types';

function resolveDevHost(): string {
  const explicit = process.env.EXPO_PUBLIC_DEV_HOST?.trim();
  if (explicit) {
    return explicit.replace(/^https?:\/\//, '').split(':')[0];
  }

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
    if (match?.[1]) {
      return match[1];
    }
  }

  return '127.0.0.1';
}

function nestBaseUrl() {
  const override = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (override) {
    return override.replace(/\/$/, '');
  }
  return `http://${resolveDevHost()}:3000`;
}

function guessName(uri: string) {
  const clean = uri.split('?')[0] ?? uri;
  const leaf = clean.split('/').pop() ?? 'photo.jpg';
  if (/\.(jpe?g|png|webp)$/i.test(leaf)) {
    return leaf;
  }
  return 'photo.jpg';
}

function mimeForName(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function fetchClosetGarments(profileId: string) {
  const { data, error } = await supabase
    .from('garments')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ClosetGarment[];
}

export async function deleteClosetGarment(garmentId: string, profileId: string) {
  const { data: existing, error: loadError } = await supabase
    .from('garments')
    .select('id, cutout_path')
    .eq('id', garmentId)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (loadError) {
    throw loadError;
  }
  if (!existing) {
    return { deleted: false };
  }

  const { error } = await supabase
    .from('garments')
    .delete()
    .eq('id', garmentId)
    .eq('profile_id', profileId);

  if (error) {
    throw error;
  }

  if (typeof existing.cutout_path === 'string' && existing.cutout_path) {
    await supabase.storage.from('wardrobe-images').remove([existing.cutout_path]);
  }

  return { deleted: true };
}

type SaveResponse = {
  status?: string;
  garment?: ClosetGarment;
  message?: string;
  error?: string;
};

async function saveWithUploadAsync(uri: string, profileId: string) {
  const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
  const result = await FileSystem.uploadAsync(
    `${nestBaseUrl()}/garments/save`,
    fileUri,
    {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: mimeForName(guessName(uri)),
      parameters: { profileId },
    },
  );
  const json = JSON.parse(result.body) as SaveResponse;
  if (result.status < 200 || result.status >= 300) {
    throw new Error(json.message ?? json.error ?? `Save failed: ${result.status}`);
  }
  return json;
}

async function saveWithFetch(uri: string, profileId: string) {
  const name = guessName(uri);
  const form = new FormData();
  const blob = await (await fetch(uri)).blob();
  form.append('file', blob, name);
  form.append('profileId', profileId);

  const response = await fetch(`${nestBaseUrl()}/garments/save`, {
    method: 'POST',
    body: form,
  });
  const json = (await response.json()) as SaveResponse;
  if (!response.ok) {
    throw new Error(json.message ?? json.error ?? `Save failed: ${response.status}`);
  }
  return json;
}

export async function saveGarmentToCloset(uri: string, profileId: string) {
  if (Platform.OS === 'web') {
    return saveWithFetch(uri, profileId);
  }
  try {
    return await saveWithUploadAsync(uri, profileId);
  } catch (uploadError) {
    try {
      return await saveWithFetch(uri, profileId);
    } catch {
      const message =
        uploadError instanceof Error ? uploadError.message : String(uploadError);
      if (/Network request failed|Failed to fetch|ECONNREFUSED/i.test(message)) {
        throw new Error(
          `Cannot reach the Closette API at ${nestBaseUrl()}. Keep Nest running on :3000 and stay on the same Wi‑Fi.`,
        );
      }
      throw uploadError instanceof Error ? uploadError : new Error(message);
    }
  }
}

export function garmentDisplayName(garment: ClosetGarment) {
  const raw = garment.subcategory ?? garment.category ?? 'Garment';
  return raw
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function garmentColorHex(garment: ClosetGarment) {
  return garment.color?.primary?.hex ?? '#1B3A5F';
}

export function garmentColorName(garment: ClosetGarment) {
  return garment.color?.primary?.name ?? 'Color';
}

export function garmentCategoryLabel(garment: ClosetGarment) {
  const raw = garment.category ?? 'piece';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
