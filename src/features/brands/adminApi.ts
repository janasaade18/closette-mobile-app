import Constants from 'expo-constants';

import { supabase } from '@/lib/supabase';
import type { BrandRow } from '@/lib/database.types';

type Envelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

function resolveDevHost(): string {
  const explicit = process.env.EXPO_PUBLIC_DEV_HOST?.trim();
  if (explicit) {
    return explicit.replace(/^https?:\/\//, '').split(':')[0];
  }

  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost,
    Constants.linkingUri,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = String(candidate).match(/(\d{1,3}(?:\.\d{1,3}){3})/);
    if (match?.[1]) return match[1];
  }

  return '127.0.0.1';
}

function nestBaseUrl() {
  const override = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (override) return override.replace(/\/$/, '');
  return `http://${resolveDevHost()}:3000`;
}

async function brandRequest<T>(path: string, method: 'POST' | 'PATCH', body: unknown) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error('Sign in as an admin first.');
  }

  let response: Response;
  try {
    response = await fetch(`${nestBaseUrl()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `Cannot reach the Closette API at ${nestBaseUrl()}. Keep Nest running on :3000.`,
    );
  }

  const json = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || !json?.data) {
    throw new Error(json?.message || 'Brand admin request failed.');
  }
  return json.data;
}

export async function createBrandAccount(input: {
  name: string;
  description: string;
  email: string;
  password: string;
}) {
  const data = await brandRequest<{
    brand: BrandRow;
    ownerEmail: string;
    temporaryPassword: string;
  }>('/brands', 'POST', {
    name: input.name,
    description: input.description,
    email: input.email,
    password: input.password,
  });

  return {
    brand: data.brand,
    ownerEmail: data.ownerEmail,
    temporaryPassword: data.temporaryPassword,
  };
}

export async function resetBrandPassword(brandId: string, password: string) {
  const data = await brandRequest<{
    ownerEmail: string | null;
    temporaryPassword: string;
  }>(`/brands/${brandId}/password`, 'POST', { password });

  return {
    ownerEmail: data.ownerEmail,
    temporaryPassword: data.temporaryPassword,
  };
}

export async function setBrandActive(brandId: string, isActive: boolean) {
  const data = await brandRequest<{ brand: BrandRow }>(
    `/brands/${brandId}/active`,
    'PATCH',
    { isActive },
  );
  return data.brand;
}
