import Constants from 'expo-constants';

import type { ClosetteUserProfile } from '@/features/auth/types';
import type { ClosetGarment } from '@/features/closet/types';

export type MuseOccasion = 'casual' | 'smart-casual' | 'work' | 'formal' | string;

export type MuseWeather = {
  temperature_c?: number;
  condition?: string;
};

export type MuseGarment = {
  id: string;
  category?: string;
  subcategory?: string | null;
  colors?: {
    primary?: string;
    secondary?: string[];
  };
  pattern?: string;
  availability?: string;
};

export type MuseOutfit = {
  outfit_id: string;
  items: string[];
  roles: Record<string, string>;
  score: number;
  reasons: string[];
  reason_codes: string[];
  signals_used: string[];
  model_version: string;
};

export type MuseRecommendResponse = {
  api_version: string;
  model_version: string;
  status: 'ok' | 'empty_wardrobe' | 'insufficient_candidates';
  recommendation_id: string;
  recommendations: MuseOutfit[];
  ranking?: {
    method: string;
    learned_model: boolean;
    feedback_events: number;
    feedback_min_events: number;
    feedback_applied: boolean;
  };
  warnings?: string[];
  excluded_items?: Array<{ item_id: string; rules: string[] }>;
  message?: string;
  error?: string;
};

export type MuseFeedbackAction = 'like' | 'save' | 'dislike' | 'dismiss' | 'worn';

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

export function museBaseUrl() {
  const override = process.env.EXPO_PUBLIC_MUSE_URL?.trim();
  if (override) {
    return override.replace(/\/$/, '');
  }
  return `http://${resolveDevHost()}:8787`;
}

const MUSE_CATEGORIES = new Set([
  'tops',
  'bottoms',
  'one-piece',
  'outerwear',
  'footwear',
  'accessories',
]);

export function closetGarmentToMuse(garment: ClosetGarment): MuseGarment {
  const category = (garment.category ?? '').toLowerCase();
  const mapped: MuseGarment = {
    id: garment.id,
    subcategory: garment.subcategory,
    availability: 'clean',
  };

  if (MUSE_CATEGORIES.has(category)) {
    mapped.category = category;
  }

  const primary = garment.color?.primary?.name?.trim().toLowerCase();
  const secondary = (garment.color?.secondary ?? [])
    .map((entry) => entry.name?.trim().toLowerCase())
    .filter((name): name is string => Boolean(name));

  if (primary) {
    mapped.colors = {
      primary,
      ...(secondary.length ? { secondary } : {}),
    };
  }

  const pattern = garment.pattern?.primary?.trim().toLowerCase();
  if (pattern) {
    mapped.pattern = pattern;
  }

  return mapped;
}

export function buildMuseProfile(profile: ClosetteUserProfile | null) {
  if (!profile) return undefined;
  return {
    preferred_styles: profile.preferred_styles ?? [],
    favorite_colors: (profile.preferred_colors ?? []).map((c) =>
      c.trim().toLowerCase(),
    ),
    preferred_garment_types: profile.preferred_clothing ?? [],
  };
}

export async function recommendOutfits(input: {
  userId: string;
  wardrobe: ClosetGarment[];
  occasion?: MuseOccasion;
  weather?: MuseWeather;
  limit?: number;
  profile?: ClosetteUserProfile | null;
}): Promise<MuseRecommendResponse> {
  const body = {
    user_id: input.userId,
    occasion: input.occasion ?? 'casual',
    weather: input.weather,
    limit: input.limit ?? 3,
    profile: buildMuseProfile(input.profile ?? null),
    wardrobe: input.wardrobe.map(closetGarmentToMuse),
  };

  let response: Response;
  try {
    response = await fetch(`${museBaseUrl()}/v1/outfits/recommend`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Network request failed|Failed to fetch|ECONNREFUSED/i.test(message)) {
      throw new Error(
        `Cannot reach Muse at ${museBaseUrl()}. Start it with: node api/server.js --port 8787`,
      );
    }
    throw error instanceof Error ? error : new Error(message);
  }

  const json = (await response.json()) as MuseRecommendResponse;
  if (!response.ok) {
    throw new Error(
      json.message ?? json.error ?? `Muse recommend failed: ${response.status}`,
    );
  }
  return json;
}

export async function sendOutfitFeedback(input: {
  recommendationId: string;
  outfitId: string;
  action: MuseFeedbackAction;
  userId?: string;
  reason?: { code?: string; note?: string };
}) {
  let response: Response;
  try {
    response = await fetch(`${museBaseUrl()}/v1/outfits/feedback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        recommendation_id: input.recommendationId,
        outfit_id: input.outfitId,
        action: input.action,
        user_id: input.userId,
        reason: input.reason,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Network request failed|Failed to fetch|ECONNREFUSED/i.test(message)) {
      throw new Error(
        `Cannot reach Muse at ${museBaseUrl()}. Start it with: node api/server.js --port 8787`,
      );
    }
    throw error instanceof Error ? error : new Error(message);
  }

  const json = (await response.json()) as {
    status?: string;
    message?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(
      json.message ?? json.error ?? `Muse feedback failed: ${response.status}`,
    );
  }
  return json;
}
