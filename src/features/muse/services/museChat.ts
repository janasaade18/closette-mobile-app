import type { ClosetteUserProfile } from '@/features/auth/types';
import type { ClosetGarment } from '@/features/closet/types';
import {
  shopCatalog,
  shopProductById,
  toMuseMarketplaceProducts,
  type ShopProduct,
} from '@/features/shop/data/catalog';

import {
  DEMO_MARKETPLACE_PRODUCTS,
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
  product?: ShopProduct;
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

function preferenceOverride(text: string, profile: ClosetteUserProfile | null) {
  const preferred_styles = [...(profile?.preferred_styles ?? [])];
  const favorite_colors = [...(profile?.preferred_colors ?? [])].map((c) =>
    c.trim().toLowerCase(),
  );

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
    preferred_styles: Array.from(new Set(preferred_styles)),
    favorite_colors,
  };
}

function titleFor(outfit: MuseOutfit, occasionLabel: string) {
  return outfit.reasons?.[0]?.replace(/\.$/, '') ?? `${occasionLabel} look`;
}

function pickOutfit(result: MuseRecommendResponse): MuseOutfit | undefined {
  const rows = result.recommendations ?? [];
  return rows.find((row) => row.mixed || (row.marketplace_items?.length ?? 0) > 0) ?? rows[0];
}

/** Prefer the product Muse mixed into the outfit; otherwise a complementary shop pick. */
function pickMarketplaceMatch(
  outfit: MuseOutfit | undefined,
  result: MuseRecommendResponse,
  wardrobe: ClosetGarment[],
  text: string,
  weather: MuseWeather,
): ShopProduct | undefined {
  const mixedId = outfit?.marketplace_items?.[0]?.product_id;
  if (mixedId) {
    const hit = shopProductById(mixedId);
    if (hit) return hit;
  }

  const wantsJacket = /\bjacket|coat|blazer|layer|rain\b/i.test(text);
  const wantsShoes = /\bshoe|loafer|sneaker|heel|boot\b/i.test(text);
  const wantsScarf = /\bscarf|wrap|accessory\b/i.test(text);
  const cool =
    (typeof weather.temperature_c === 'number' && weather.temperature_c <= 18) ||
    weather.condition === 'rain' ||
    weather.condition === 'snow' ||
    weather.condition === 'cold';

  const hasOuter = wardrobe.some((item) =>
    (item.category ?? '').toLowerCase().includes('outer'),
  );
  const hasFootwear = wardrobe.some((item) =>
    (item.category ?? '').toLowerCase().includes('footwear'),
  );

  if (wantsScarf || (cool && !hasOuter)) {
    const outer =
      shopCatalog.find((p) => p.id === 'mkt-raincoat-01') ??
      shopCatalog.find((p) => p.category === 'Outerwear' && p.in_stock);
    if (outer && (wantsJacket || cool)) return outer;
    const scarf = shopCatalog.find((p) => p.subcategory === 'scarf' && p.in_stock);
    if (scarf) return scarf;
  }

  if (wantsJacket) {
    return shopCatalog.find((p) => p.category === 'Outerwear' && p.in_stock);
  }
  if (wantsShoes || (result.status === 'insufficient_candidates' && !hasFootwear)) {
    return shopCatalog.find((p) => p.category === 'Shoes' && p.in_stock);
  }

  // Always surface one partner complement that fits the look when Market is on.
  if (cool) {
    return (
      shopCatalog.find((p) => p.id === 'mkt-jacket-01') ??
      shopCatalog.find((p) => p.subcategory === 'scarf')
    );
  }
  return shopCatalog.find((p) => p.id === 'mkt-bag-01') ?? shopCatalog.find((p) => p.in_stock);
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
  const context: ChatContext = {
    occasion: occasion.value,
    occasionLabel: occasion.label,
    weather,
    scheduleLabel,
  };

  if (input.wardrobe.length === 0) {
    return {
      text: 'Your closet is empty. Add a few pieces first, then I can build an outfit from what you own — and pull partner pieces from the marketplace.',
      context,
      status: 'empty_wardrobe',
    };
  }

  const override = preferenceOverride(text, input.profile);
  const catalog = DEMO_MARKETPLACE_PRODUCTS.length
    ? DEMO_MARKETPLACE_PRODUCTS
    : toMuseMarketplaceProducts();

  const result = await recommendOutfits({
    userId: input.userId,
    wardrobe: input.wardrobe,
    occasion: context.occasion,
    weather: context.weather,
    limit: 4,
    profile: input.profile
      ? {
          ...input.profile,
          preferred_styles: override.preferred_styles,
          preferred_colors: override.favorite_colors,
        }
      : null,
    marketplace: { enabled: true, include_mixed: true },
    marketplaceProducts: catalog,
  });

  const outfit = pickOutfit(result);
  const product = pickMarketplaceMatch(outfit, result, input.wardrobe, text, weather);

  if (!outfit) {
    return {
      text:
        result.status === 'insufficient_candidates'
          ? 'I need a top, bottom, and shoes (or a one-piece and shoes). I can fill gaps from the marketplace once those cores exist.'
          : result.status === 'weather_unsuitable'
            ? result.message ??
              'Nothing in your closet fits this weather. Browse the marketplace for a layer that would help.'
            : 'I could not build an outfit from the current closet and filters. Try another occasion or add more pieces.',
      context,
      product,
      status: result.status,
    };
  }

  const temp =
    typeof context.weather.temperature_c === 'number'
      ? `${context.weather.temperature_c}°`
      : '';
  const condition = context.weather.condition ? ` ${context.weather.condition}` : '';
  const weatherBit = `${temp}${condition}`.trim();
  const mixed = Boolean(outfit.mixed || outfit.marketplace_items?.length);

  let textReply = mixed
    ? `Here is a look mixing your closet with the marketplace for ${context.occasionLabel.toLowerCase()}`
    : `Here is an outfit from your closet for ${context.occasionLabel.toLowerCase()}`;
  if (weatherBit) textReply += ` · ${weatherBit}`;
  textReply += '.';
  if (outfit.reasons?.length) {
    textReply += ` ${outfit.reasons[0]}`;
  }
  if (product) {
    textReply += mixed
      ? ` I added ${product.brand} ${product.name} from the shop.`
      : ` Pair it with ${product.brand} ${product.name} from the marketplace.`;
  }

  return {
    text: textReply,
    context,
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
  'Make it dressier',
  'Swap the shoes',
  'Add a jacket',
  "What's good for a rainy uni day?",
];

export const DEFAULT_CHAT_CONTEXT: ChatContext = {
  occasion: 'smart-casual',
  occasionLabel: 'Smart casual',
  weather: { temperature_c: 18, condition: 'rain' },
  scheduleLabel: 'Anytime',
};
