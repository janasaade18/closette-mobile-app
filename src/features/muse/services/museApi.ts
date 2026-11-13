import Constants from 'expo-constants';

import type { ClosetteUserProfile } from '@/features/auth/types';
import type { ClosetGarment } from '@/features/closet/types';
import { museMarketplaceProducts } from '@/features/muse/data/marketplaceCatalog';

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
  formality?: string;
  style_tags?: string[];
  source?: 'wardrobe' | 'marketplace';
  price?: number;
  currency?: string;
  sizes?: string[];
  brand?: string;
  name?: string;
  in_stock?: boolean;
  temperature_range_c?: { min_c?: number; max_c?: number };
  image_url?: string;
};

export type MuseMarketplaceItem = {
  product_id: string;
  role?: string;
  category?: string;
  subcategory?: string;
  name?: string | null;
  price?: number;
  currency?: string;
  brand?: string | null;
  sizes?: string[];
  colors?: { primary?: string; secondary?: string[] };
  image_url?: string | null;
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
  mixed?: boolean;
  marketplace_items?: MuseMarketplaceItem[];
};

export type MuseRankingMeta = {
  method?: string;
  learned_model?: boolean;
  personalization?: string;
  personalization_applied?: boolean;
  linucb_updates?: number;
  feedback_events?: number;
  feedback_min_events?: number;
  feedback_applied?: boolean;
  marketplace_enabled?: boolean;
  marketplace_products_considered?: number;
  marketplace_products_used?: number;
  marketplace_mixed_outfits?: number;
};

export type MuseRecommendResponse = {
  api_version: string;
  model_version: string;
  status:
    | 'ok'
    | 'empty_wardrobe'
    | 'insufficient_candidates'
    | 'weather_unsuitable'
    | 'weather_compromise'
    | string;
  recommendation_id: string;
  recommendations: MuseOutfit[];
  ranking?: MuseRankingMeta;
  warnings?: Array<string | { code?: string; message?: string }>;
  excluded_items?: Array<{ item_id: string; rules: string[] }>;
  marketplace_excluded?: Array<{ id: string; reason: string }>;
  weather?: {
    temperature_c?: number | null;
    advice?: string | null;
    excluded_for_temperature?: number;
  };
  message?: string;
  error?: string;
  score_semantics?: string;
};

export type MuseFeedbackAction =
  | 'like'
  | 'save'
  | 'dislike'
  | 'dismiss'
  | 'worn'
  | 'purchase';

export type MuseMarketplaceOptions = {
  enabled?: boolean;
  budget_max?: number;
  budget_min?: number;
  sizes?: string[];
  include_mixed?: boolean;
  max_products?: number;
};

export type MuseTravelDayPlan = {
  date: string;
  label?: string | null;
  occasion?: string;
  weather?: MuseWeather | null;
  season?: string | null;
  status: string;
  outfit: MuseOutfit | null;
  rotation_penalty?: number | null;
  notes?: string[];
};

export type MuseTravelPackResponse = {
  api_version: string;
  model_version: string;
  status: 'ok' | 'partial' | 'insufficient_candidates' | string;
  destination?: { name?: string | null; country?: string | null } | null;
  trip?: { start_date?: string | null; days?: number };
  luggage?: {
    max_items?: number;
    max_weight_kg?: number | null;
    unique_items?: number;
    total_weight_kg?: number;
    wardrobe_items?: number;
    marketplace_items?: number;
    prefer_rewear?: boolean;
    max_core_reuses?: number;
  };
  day_plans: MuseTravelDayPlan[];
  packing_list: Array<{
    id: string;
    uses: number;
    source: string;
    category?: string | null;
    weight_kg?: number;
    price?: number | null;
  }>;
  marketplace_suggestions: MuseMarketplaceItem[];
  warnings?: Array<{ code?: string; message?: string }>;
  message?: string;
  error?: string;
};

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

async function museFetch(path: string, body: unknown, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${museBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/aborted|AbortError/i.test(message)) {
      throw new Error(
        `Muse timed out after ${Math.round(timeoutMs / 1000)}s at ${museBaseUrl()}. Check EXPO_PUBLIC_MUSE_URL / that Muse is running on :8787.`,
      );
    }
    if (/Network request failed|Failed to fetch|ECONNREFUSED/i.test(message)) {
      throw new Error(
        `Cannot reach Muse at ${museBaseUrl()}. Start it with: node api/server.js --port 8787`,
      );
    }
    throw error instanceof Error ? error : new Error(message);
  } finally {
    clearTimeout(timer);
  }
  return response;
}

export function closetGarmentToMuse(garment: ClosetGarment): MuseGarment {
  const category = (garment.category ?? '').toLowerCase();
  const mapped: MuseGarment = {
    id: garment.id,
    subcategory: garment.subcategory,
    availability: 'clean',
    source: 'wardrobe',
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

export function rankingSummary(ranking?: MuseRankingMeta, modelVersion?: string) {
  const parts: string[] = [];
  if (modelVersion) parts.push(modelVersion);
  if (ranking?.learned_model) parts.push('learned MLP');
  if (ranking?.personalization_applied) parts.push('personalized');
  else if (ranking?.personalization === 'linucb') parts.push('personalization ready');
  if (ranking?.marketplace_mixed_outfits) {
    parts.push(`${ranking.marketplace_mixed_outfits} mixed`);
  }
  return parts.join(' · ') || 'Muse';
}

export async function recommendOutfits(input: {
  userId: string;
  wardrobe: ClosetGarment[];
  occasion?: MuseOccasion;
  weather?: MuseWeather;
  limit?: number;
  profile?: ClosetteUserProfile | null;
  marketplace?: MuseMarketplaceOptions;
  marketplaceProducts?: MuseGarment[];
}): Promise<MuseRecommendResponse> {
  const body: Record<string, unknown> = {
    user_id: input.userId,
    occasion: input.occasion ?? 'casual',
    weather: input.weather,
    limit: input.limit ?? 3,
    profile: buildMuseProfile(input.profile ?? null),
    wardrobe: input.wardrobe.map(closetGarmentToMuse),
  };
  if (input.marketplace) body.marketplace = input.marketplace;
  if (input.marketplaceProducts?.length) {
    body.marketplace_products = input.marketplaceProducts;
  }

  const response = await museFetch('/v1/outfits/recommend', body);
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
  source?: 'wardrobe' | 'marketplace';
  productIds?: string[];
}) {
  const response = await museFetch('/v1/outfits/feedback', {
    recommendation_id: input.recommendationId,
    outfit_id: input.outfitId,
    action: input.action,
    user_id: input.userId,
    reason: input.reason,
    source: input.source,
    product_ids: input.productIds,
  });

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

export async function packTravel(input: {
  userId: string;
  wardrobe: ClosetGarment[];
  destination?: { name?: string; country?: string };
  days: Array<{
    date: string;
    occasion?: MuseOccasion;
    weather?: MuseWeather;
    label?: string;
  }>;
  luggage?: {
    max_items?: number;
    max_weight_kg?: number;
    prefer_rewear?: boolean;
    max_core_reuses?: number;
  };
  marketplace?: MuseMarketplaceOptions;
  marketplaceProducts?: MuseGarment[];
  profile?: ClosetteUserProfile | null;
  candidatesPerDay?: number;
}): Promise<MuseTravelPackResponse> {
  const body: Record<string, unknown> = {
    user_id: input.userId,
    wardrobe: input.wardrobe.map(closetGarmentToMuse),
    destination: input.destination,
    trip: {
      start_date: input.days[0]?.date,
      days: input.days,
    },
    luggage: input.luggage ?? {
      max_items: 12,
      prefer_rewear: true,
      max_core_reuses: 1,
    },
    profile: buildMuseProfile(input.profile ?? null),
    candidates_per_day: input.candidatesPerDay ?? 4,
  };
  if (input.marketplace) body.marketplace = input.marketplace;
  if (input.marketplaceProducts?.length) {
    body.marketplace_products = input.marketplaceProducts;
  }

  const response = await museFetch('/v1/travel/pack', body);
  const json = (await response.json()) as MuseTravelPackResponse;
  if (!response.ok) {
    throw new Error(
      json.message ?? json.error ?? `Muse travel pack failed: ${response.status}`,
    );
  }
  return json;
}

/** Photo-backed demo catalog — see `marketplaceCatalog.ts`. */
export const DEMO_MARKETPLACE_PRODUCTS = museMarketplaceProducts();

