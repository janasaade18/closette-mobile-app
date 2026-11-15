import type { ClosetteUserProfile } from '@/features/auth/types';
import type { ClosetGarment } from '@/features/closet/types';
import { fetchActiveCatalog, toMuseProducts } from '@/features/catalog/api';
import type { CatalogProduct } from '@/features/catalog/types';

import {
  recommendOutfits,
  type MuseOccasion,
  type MuseOutfit,
  type MuseRecommendResponse,
  type MuseWeather,
} from './museApi';

export type ChatContext = {
  occasion: MuseOccasion;
  occasionLabel: string;
  weather: MuseWeather;
  scheduleLabel: string;
  /** Wardrobe ids the user rejected in this chat. */
  avoidedGarmentIds?: string[];
  /** Last shown outfit item ids (closet + market). */
  lastOutfitItemIds?: string[];
};

export type ChatOutfitPayload = {
  recommendationId: string;
  outfit: MuseOutfit;
  title: string;
  score: number;
};

export type MuseChatReply = {
  text: string;
  context: ChatContext;
  outfit?: ChatOutfitPayload;
  product?: CatalogProduct;
  status?: MuseRecommendResponse['status'];
};

const OCCASION_PATTERNS: Array<{ value: MuseOccasion; label: string; match: RegExp }> = [
  { value: 'formal', label: 'Formal', match: /\b(formal|black.?tie|gala|wedding|engagement)\b/i },
  { value: 'work', label: 'Work', match: /\b(work|office|meeting|interview|business)\b/i },
  {
    value: 'smart-casual',
    label: 'Smart casual',
    match: /\b(smart.?casual|uni|university|date|dinner|party|evening)\b/i,
  },
  { value: 'casual', label: 'Casual', match: /\b(casual|weekend|brunch|errands|everyday)\b/i },
];

const DAY_PATTERNS: Array<{ label: string; match: RegExp }> = [
  { label: 'Sat · evening', match: /\bsat(urday)?\b/i },
  { label: 'Sun · daytime', match: /\bsun(day)?\b/i },
  { label: 'Fri · evening', match: /\bfri(day)?\b/i },
  { label: 'Tonight', match: /\btonight\b/i },
  { label: 'Tomorrow', match: /\btomorrow\b/i },
];

function parseOccasion(text: string, fallback: MuseOccasion, fallbackLabel: string) {
  for (const entry of OCCASION_PATTERNS) {
    if (entry.match.test(text)) {
      return { value: entry.value, label: entry.label };
    }
  }
  if (/\bdress(y|ier)?\b|\belegant\b|\bpolished\b/i.test(text)) {
    return { value: 'smart-casual' as MuseOccasion, label: 'Smart casual' };
  }
  return { value: fallback, label: fallbackLabel };
}

function parseWeather(text: string, fallback: MuseWeather): MuseWeather {
  const tempMatch =
    text.match(/(-?\d{1,2})\s*°?\s*c\b/i) ?? text.match(/\b(-?\d{1,2})\s*degrees?\b/i);
  let temperature_c = fallback.temperature_c ?? 20;
  if (tempMatch) {
    temperature_c = Number(tempMatch[1]);
  } else if (/\b(hot|heatwave|summer)\b/i.test(text)) {
    temperature_c = 28;
  } else if (/\b(cold|freezing|winter)\b/i.test(text)) {
    temperature_c = 6;
  } else if (/\b(mild|warm)\b/i.test(text)) {
    temperature_c = 18;
  }

  let condition = fallback.condition;
  if (/\brain|drizzle|wet\b/i.test(text)) condition = 'rain';
  else if (/\bsnow\b/i.test(text)) condition = 'snow';
  else if (/\bclear|sunny|sun\b/i.test(text)) condition = 'clear';
  else if (/\bcloud|overcast\b/i.test(text)) condition = 'cloudy';

  return { temperature_c, condition };
}

function parseSchedule(text: string, fallback: string) {
  for (const entry of DAY_PATTERNS) {
    if (entry.match.test(text)) return entry.label;
  }
  if (/\bevening\b/i.test(text)) return 'Evening';
  if (/\bmorning\b/i.test(text)) return 'Morning';
  return fallback;
}

function wantsAnotherLook(text: string) {
  return /\b(another|different|something else|not this|don'?t like (this|that|it))\b/i.test(text);
}

function preferenceOverride(text: string, profile: ClosetteUserProfile | null) {
  const preferred_styles = [...(profile?.preferred_styles ?? [])];
  const favorite_colors = [...(profile?.preferred_colors ?? [])].map((c) =>
    c.trim().toLowerCase(),
  );
  const preferred_garment_types = [...(profile?.preferred_clothing ?? [])];

  if (/\bdress(y|ier)|elegant|polished|formal\b/i.test(text)) {
    preferred_styles.push('elegant', 'smart');
  }
  if (/\bcasual|relaxed|chill\b/i.test(text)) {
    preferred_styles.push('casual', 'minimal');
  }
  if (/\bjacket|coat|layer|blazer|scarf\b/i.test(text)) {
    preferred_styles.push('layered');
  }

  return {
    preferred_styles: Array.from(new Set(preferred_styles.map((s) => s.toLowerCase()))),
    favorite_colors,
    preferred_garment_types: Array.from(
      new Set(preferred_garment_types.map((s) => s.toLowerCase())),
    ),
  };
}

function titleFor(outfit: MuseOutfit, occasionLabel: string) {
  return outfit.reasons?.[0]?.replace(/\.$/, '') ?? `${occasionLabel} look`;
}

function outfitUsesIds(outfit: MuseOutfit, ids: Set<string>) {
  return (outfit.items ?? []).some((id) => ids.has(id));
}

function pickOutfit(
  result: MuseRecommendResponse,
  avoidedIds: Set<string>,
): MuseOutfit | undefined {
  const rows = result.recommendations ?? [];
  if (!rows.length) return undefined;

  const scored = [...rows].sort((a, b) => {
    let scoreA = a.score ?? 0;
    let scoreB = b.score ?? 0;
    if (a.mixed) scoreA += 0.25;
    if (b.mixed) scoreB += 0.25;
    if (outfitUsesIds(a, avoidedIds)) scoreA -= 3;
    if (outfitUsesIds(b, avoidedIds)) scoreB -= 3;
    return scoreB - scoreA;
  });

  return (
    scored.find((row) => !outfitUsesIds(row, avoidedIds)) ??
    scored.find((row) => row.mixed || (row.marketplace_items?.length ?? 0) > 0) ??
    scored[0]
  );
}

/** Show-don’t-talk: surface a weather-fit market piece when the look is cool/wet. */
function pickMarketplaceMatch(
  outfit: MuseOutfit | undefined,
  weather: MuseWeather,
  products: CatalogProduct[],
): CatalogProduct | undefined {
  const mixedId = outfit?.marketplace_items?.[0]?.product_id;
  if (mixedId) {
    const hit = products.find((product) => product.id === mixedId);
    if (hit) return hit;
  }

  const cool =
    (typeof weather.temperature_c === 'number' && weather.temperature_c <= 18) ||
    weather.condition === 'rain' ||
    weather.condition === 'snow' ||
    weather.condition === 'cold';
  if (!cool) return undefined;
  if (weather.condition === 'rain') {
    return products.find((product) =>
      /rain|jacket|coat|outer/i.test(`${product.category ?? ''} ${product.name}`),
    );
  }
  return products.find((product) => /outer|jacket|coat/i.test(product.category ?? ''));
}

function replyCopy(context: ChatContext, mixed: boolean) {
  const temp =
    typeof context.weather.temperature_c === 'number'
      ? `${context.weather.temperature_c}°`
      : '';
  const condition = context.weather.condition ? ` ${context.weather.condition}` : '';
  const weatherBit = `${temp}${condition}`.trim();

  let textReply = `Here is a ${context.occasionLabel.toLowerCase()} look`;
  if (weatherBit) textReply += ` · ${weatherBit}`;
  textReply += mixed ? ', with a marketplace piece in the mix.' : '.';
  return textReply;
}

export async function replyToMuseChat(input: {
  text: string;
  userId: string;
  wardrobe: ClosetGarment[];
  profile: ClosetteUserProfile | null;
  context: ChatContext;
}): Promise<MuseChatReply> {
  const text = input.text.trim();
  const occasion = parseOccasion(text, input.context.occasion, input.context.occasionLabel);
  const weather = parseWeather(text, input.context.weather);
  const scheduleLabel = parseSchedule(text, input.context.scheduleLabel);

  const avoided = new Set(input.context.avoidedGarmentIds ?? []);
  if (wantsAnotherLook(text)) {
    for (const id of input.context.lastOutfitItemIds ?? []) avoided.add(id);
  }

  const context: ChatContext = {
    occasion: occasion.value,
    occasionLabel: occasion.label,
    weather,
    scheduleLabel,
    avoidedGarmentIds: [...avoided],
    lastOutfitItemIds: input.context.lastOutfitItemIds,
  };

  if (input.wardrobe.length === 0) {
    return {
      text: 'Your closet is empty. Add a few pieces first, then I can build an outfit from what you own — and pull partner pieces from the marketplace.',
      context,
      status: 'empty_wardrobe',
    };
  }

  const override = preferenceOverride(text, input.profile);
  const products = await fetchActiveCatalog();
  const catalog = toMuseProducts(products);

  const result = await recommendOutfits({
    userId: input.userId,
    wardrobe: input.wardrobe,
    occasion: context.occasion,
    weather: context.weather,
    limit: 6,
    profile: input.profile
      ? {
          ...input.profile,
          preferred_styles: override.preferred_styles,
          preferred_colors: override.favorite_colors,
          preferred_clothing: override.preferred_garment_types,
        }
      : null,
    preferencesOverride: {
      gender: input.profile?.gender ?? undefined,
      preferred_styles: override.preferred_styles,
      favorite_colors: override.favorite_colors,
      preferred_garment_types: override.preferred_garment_types,
      avoid_garment_ids: [...avoided],
    },
    marketplace: {
      enabled: true,
      include_mixed: true,
      max_products: 16,
    },
    marketplaceProducts: catalog,
  });

  const outfit = pickOutfit(result, avoided);
  const product = pickMarketplaceMatch(outfit, weather, products);
  const nextContext: ChatContext = {
    ...context,
    lastOutfitItemIds: outfit?.items ?? [],
  };

  if (!outfit) {
    return {
      text: 'I could not build an outfit from your closet or the marketplace for that request.',
      context: nextContext,
      status: result.status,
    };
  }

  const mixed = Boolean(outfit.mixed || outfit.marketplace_items?.length);
  return {
    text: replyCopy(context, mixed),
    context: nextContext,
    outfit: {
      recommendationId: result.recommendation_id,
      outfit,
      title: titleFor(outfit, context.occasionLabel),
      score: outfit.score,
    },
    product,
    status: result.status,
  };
}

export const MUSE_CHAT_STARTERS = [
  'Something for rain',
  'Make it dressier',
  'Casual weekend',
  'Work meeting',
  'Show me another look',
];

export const DEFAULT_CHAT_CONTEXT: ChatContext = {
  occasion: 'smart-casual',
  occasionLabel: 'Smart casual',
  weather: { temperature_c: 18, condition: 'rain' },
  scheduleLabel: 'Anytime',
  avoidedGarmentIds: [],
  lastOutfitItemIds: [],
};
