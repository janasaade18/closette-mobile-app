import type { ClosetteUserProfile } from '@/features/auth/types';
import {
  garmentColorName,
  garmentDisplayName,
} from '@/features/closet/services/closetApi';
import type { ClosetGarment } from '@/features/closet/types';
import {
  fetchActiveCatalog,
  catalogProductById,
  toMuseProducts,
} from '@/features/catalog/api';
import type { CatalogProduct } from '@/features/catalog/types';
import { nestDevBaseUrl } from '@/lib/devHost';

import {
  buildMuseProfile,
  closetGarmentToMuse,
  type MuseOccasion,
  type MuseOutfit,
  type MuseRecommendResponse,
  type MuseWeather,
} from './museApi';

/** Drop UUIDs / hex ids from assistant copy; prefer closet labels. */
function stripIdsFromChatText(text: string, wardrobe: ClosetGarment[]): string {
  const byId = new Map<string, string>();
  for (const garment of wardrobe) {
    const label = `${garmentColorName(garment)} ${garmentDisplayName(garment)}`
      .replace(/\s+/g, ' ')
      .trim();
    byId.set(garment.id.toLowerCase(), label);
    byId.set(garment.id.slice(0, 8).toLowerCase(), label);
  }

  let out = text.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    (match) => byId.get(match.toLowerCase()) ?? '',
  );
  out = out.replace(/`([^`]{4,64})`/g, (_full, inner: string) => {
    const key = String(inner).toLowerCase();
    if (byId.has(key) || byId.has(key.slice(0, 8))) {
      return byId.get(key) ?? byId.get(key.slice(0, 8)) ?? '';
    }
    if (/^[0-9a-f-]{8,36}$/i.test(inner)) return '';
    return inner;
  });
  out = out.replace(/\s*\(([0-9a-f-]{8,36})\)/gi, '');
  return out.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export type ChatContext = {
  occasion: MuseOccasion;
  occasionLabel: string;
  weather: MuseWeather;
  scheduleLabel: string;
  /** Display label for chips (e.g. Home · Bourj Hammoud). */
  location?: string;
  /** Short geocode-friendly name / coords hint for Nest weather. */
  locationQuery?: string;
  latitude?: number;
  longitude?: number;
  avoidedGarmentIds?: string[];
  lastOutfitItemIds?: string[];
};

export type ChatOutfitPayload = {
  recommendationId: string;
  outfit: MuseOutfit;
  title: string;
  score: number;
};

export type MuseChatHistoryItem = {
  role: 'user' | 'assistant' | 'muse';
  content: string;
};

export type MuseChatReply = {
  text: string;
  context: ChatContext;
  outfit?: ChatOutfitPayload;
  product?: CatalogProduct;
  travel?: Record<string, unknown>;
  status?: MuseRecommendResponse['status'];
  memory?: {
    summary: string;
    facts: string[];
  };
  homeLocation?: string;
};

function nestBaseUrl() {
  return nestDevBaseUrl();
}

function asChatContext(value: unknown, fallback: ChatContext): ChatContext {
  if (!value || typeof value !== 'object') return fallback;
  const row = value as Record<string, unknown>;
  const weather =
    row.weather && typeof row.weather === 'object'
      ? (row.weather as MuseWeather)
      : fallback.weather;
  return {
    occasion:
      typeof row.occasion === 'string' ? row.occasion : fallback.occasion,
    occasionLabel:
      typeof row.occasionLabel === 'string'
        ? row.occasionLabel
        : fallback.occasionLabel,
    weather,
    location:
      typeof row.location === 'string' ? row.location : fallback.location,
    locationQuery:
      typeof row.locationQuery === 'string'
        ? row.locationQuery
        : fallback.locationQuery,
    latitude:
      typeof row.latitude === 'number' ? row.latitude : fallback.latitude,
    longitude:
      typeof row.longitude === 'number' ? row.longitude : fallback.longitude,
    scheduleLabel:
      typeof row.scheduleLabel === 'string'
        ? row.scheduleLabel
        : fallback.scheduleLabel,
    avoidedGarmentIds: Array.isArray(row.avoidedGarmentIds)
      ? row.avoidedGarmentIds.filter((id): id is string => typeof id === 'string')
      : fallback.avoidedGarmentIds,
    lastOutfitItemIds: Array.isArray(row.lastOutfitItemIds)
      ? row.lastOutfitItemIds.filter((id): id is string => typeof id === 'string')
      : fallback.lastOutfitItemIds,
  };
}

/** Muse stylist agent via Nest POST /muse/chat (Gemini tool calling → Muse engine). */
export async function replyToMuseChat(input: {
  text: string;
  userId: string;
  wardrobe: ClosetGarment[];
  profile: ClosetteUserProfile | null;
  context: ChatContext;
  history?: MuseChatHistoryItem[];
  memorySummary?: string;
  memoryFacts?: string[];
}): Promise<MuseChatReply> {
  const text = input.text.trim();

  // Catalog for Muse marketplace tool — non-blocking if catalog is slow.
  const products = await Promise.race([
    fetchActiveCatalog().catch(() => [] as CatalogProduct[]),
    new Promise<CatalogProduct[]>((resolve) =>
      setTimeout(() => resolve([]), 2500),
    ),
  ]);
  const catalog = toMuseProducts(products).slice(0, 48);

  const controller = new AbortController();
  // Agent + Gemini can take ~20–40s; leave headroom for phone RTT.
  const timer = setTimeout(() => controller.abort(), 90_000);
  const chatUrl = `${nestBaseUrl()}/muse/chat`;

  let response: Response;
  try {
    response = await fetch(chatUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: input.userId,
        message: text,
        history: (input.history ?? []).slice(-12),
        wardrobe: input.wardrobe.map(closetGarmentToMuse),
        profile: buildMuseProfile(input.profile),
        context: {
          ...input.context,
          location:
            input.context.locationQuery ??
            input.context.location ??
            input.profile?.location ??
            undefined,
          latitude: input.context.latitude,
          longitude: input.context.longitude,
        },
        marketplaceProducts: catalog,
        location:
          input.context.locationQuery ??
          input.context.location ??
          input.profile?.location ??
          undefined,
        latitude: input.context.latitude,
        longitude: input.context.longitude,
        memorySummary: input.memorySummary ?? '',
        memoryFacts: input.memoryFacts ?? [],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/aborted|AbortError|canceled|cancelled/i.test(message)) {
      throw new Error(
        `Muse chat timed out at ${chatUrl}. Phone only needs Nest :3000 — update EXPO_PUBLIC_API_URL to this PC’s current Wi‑Fi IP (ipconfig), then reload Expo.`,
      );
    }
    if (/Network request failed|Failed to fetch|ECONNREFUSED/i.test(message)) {
      throw new Error(
        `Cannot reach Nest at ${chatUrl}. Same Wi‑Fi + EXPO_PUBLIC_API_URL = this PC’s LAN IP:3000.`,
      );
    }
    throw error instanceof Error ? error : new Error(message);
  } finally {
    clearTimeout(timer);
  }

  const json = (await response.json()) as {
    success?: boolean;
    data?: {
      text?: string;
      outfit?: ChatOutfitPayload;
      travel?: Record<string, unknown>;
      context?: unknown;
      status?: string;
      memory?: { summary?: string; facts?: string[] };
      homeLocation?: string;
    };
    text?: string;
    outfit?: ChatOutfitPayload;
    travel?: Record<string, unknown>;
    context?: unknown;
    status?: string;
    memory?: { summary?: string; facts?: string[] };
    homeLocation?: string;
    message?: string;
    error?: string;
  };

  const data = json.data ?? json;
  if (!response.ok) {
    throw new Error(
      (typeof json.message === 'string' && json.message) ||
        (typeof json.error === 'string' && json.error) ||
        `Muse chat failed (${response.status})`,
    );
  }

  const context = asChatContext(data.context, {
    ...input.context,
    lastOutfitItemIds:
      data.outfit?.outfit?.items ?? input.context.lastOutfitItemIds,
  });

  const outfit = data.outfit;
  const marketId = outfit?.outfit?.marketplace_items?.[0]?.product_id;
  const product = marketId
    ? catalogProductById(marketId) ??
      products.find((row) => row.id === marketId)
    : undefined;

  const memoryRaw = data.memory;
  return {
    text: stripIdsFromChatText(
      (typeof data.text === 'string' && data.text.trim()) ||
        'Tell me the occasion, weather, or trip and I will style you from your closet.',
      input.wardrobe,
    ),
    context,
    outfit,
    product,
    travel: data.travel,
    memory: memoryRaw
      ? {
          summary:
            typeof memoryRaw.summary === 'string' ? memoryRaw.summary : '',
          facts: Array.isArray(memoryRaw.facts)
            ? memoryRaw.facts.filter((f): f is string => typeof f === 'string')
            : [],
        }
      : undefined,
    homeLocation:
      typeof data.homeLocation === 'string' && data.homeLocation.trim()
        ? data.homeLocation.trim()
        : undefined,
    status: data.status,
  };
}

export const MUSE_CHAT_STARTERS = [
  'What should I wear today?',
  'Make it dressier',
  'Casual weekend',
  'Work meeting',
  'Show me another look',
];

export const DEFAULT_CHAT_CONTEXT: ChatContext = {
  occasion: 'smart-casual',
  occasionLabel: 'Smart casual',
  weather: {},
  scheduleLabel: 'Anytime',
  avoidedGarmentIds: [],
  lastOutfitItemIds: [],
};
