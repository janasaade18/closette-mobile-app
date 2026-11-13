import { Colors } from '@/constants/theme';
import type { MuseGarment } from '@/features/muse/services/museApi';

export type ShopCategory =
  | 'Shoes'
  | 'Tops'
  | 'Bottoms'
  | 'Outerwear'
  | 'Bags'
  | 'Accessories'
  | 'Dresses';

export type ShopProduct = {
  id: string;
  name: string;
  price: number;
  brand: string;
  mark: string;
  category: ShopCategory;
  subcategory: string;
  museCategory: MuseGarment['category'];
  formality: string;
  /** male | female | unisex — Muse filters marketplace by profile gender. */
  gender: 'male' | 'female' | 'unisex';
  colors: { primary: string; secondary?: string[] };
  style_tags: string[];
  sizes: string[];
  temperature_range_c: { min_c: number; max_c: number };
  image_url: string;
  in_stock: boolean;
  /** Soft tile behind fallback (kept for older illustration paths). */
  tile: string;
  kind: 'shoe' | 'shirt' | 'pants' | 'bag' | 'outer' | 'accessory' | 'dress';
};

const BRAND_MARK: Record<string, string> = {
  Orbit: 'O',
  Morrow: 'M',
  North: 'N',
  Line: 'L',
  Atelier: 'A',
  Hearth: 'H',
};

function product(
  partial: Omit<ShopProduct, 'mark' | 'tile' | 'in_stock' | 'gender'> & {
    in_stock?: boolean;
    tile?: string;
    gender?: ShopProduct['gender'];
  },
): ShopProduct {
  return {
    in_stock: true,
    gender: 'unisex',
    tile: Colors.light.softBlue,
    mark: BRAND_MARK[partial.brand] ?? partial.brand.slice(0, 1),
    ...partial,
  };
}

/**
 * Full partner ecommerce catalog — real Unsplash product photos.
 * Muse Market mode reads the same list via `toMuseMarketplaceProducts()`.
 */
export const shopCatalog: ShopProduct[] = [
  product({
    id: 'mkt-sneaker-01',
    name: 'Cloud Runner',
    price: 89,
    brand: 'Orbit',
    category: 'Shoes',
    subcategory: 'sneakers',
    museCategory: 'footwear',
    formality: 'casual',
    colors: { primary: 'white', secondary: ['grey'] },
    style_tags: ['minimal', 'street'],
    sizes: ['40', '41', '42', '43'],
    temperature_range_c: { min_c: 8, max_c: 34 },
    image_url:
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',
    kind: 'shoe',
    tile: Colors.light.softBlue,
  }),
  product({
    id: 'mkt-sneaker-02',
    name: 'Trail Low',
    price: 74,
    brand: 'North',
    category: 'Shoes',
    subcategory: 'sneakers',
    museCategory: 'footwear',
    formality: 'casual',
    colors: { primary: 'green' },
    style_tags: ['street'],
    sizes: ['40', '41', '42', '43', '44'],
    temperature_range_c: { min_c: 6, max_c: 32 },
    image_url:
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=80',
    kind: 'shoe',
    tile: Colors.light.oliveTile,
  }),
  product({
    id: 'mkt-loafer-01',
    name: 'Evening Loafer',
    price: 140,
    brand: 'Atelier',
    category: 'Shoes',
    subcategory: 'formal-shoes',
    museCategory: 'footwear',
    formality: 'formal',
    colors: { primary: 'black' },
    style_tags: ['classic', 'elegant'],
    sizes: ['40', '41', '42'],
    temperature_range_c: { min_c: 0, max_c: 28 },
    image_url:
      'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=80',
    kind: 'shoe',
    tile: Colors.light.sand,
  }),
  product({
    id: 'mkt-boot-01',
    name: 'Storm Chelsea',
    price: 165,
    brand: 'Hearth',
    category: 'Shoes',
    subcategory: 'boots',
    museCategory: 'footwear',
    formality: 'smart-casual',
    colors: { primary: 'brown' },
    style_tags: ['classic'],
    sizes: ['40', '41', '42', '43'],
    temperature_range_c: { min_c: -8, max_c: 16 },
    image_url:
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=900&q=80',
    kind: 'shoe',
    tile: Colors.light.sandTile,
  }),
  product({
    id: 'mkt-heels-01',
    name: 'Noir Heel',
    price: 120,
    brand: 'Line',
    category: 'Shoes',
    subcategory: 'heels',
    museCategory: 'footwear',
    formality: 'formal',
    gender: 'female',
    colors: { primary: 'black' },
    style_tags: ['elegant'],
    sizes: ['36', '37', '38', '39'],
    temperature_range_c: { min_c: 8, max_c: 30 },
    image_url:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80',
    kind: 'shoe',
  }),
  product({
    id: 'mkt-sandal-01',
    name: 'Summer Strap',
    price: 58,
    brand: 'Orbit',
    category: 'Shoes',
    subcategory: 'sandals',
    museCategory: 'footwear',
    formality: 'casual',
    colors: { primary: 'tan' },
    style_tags: ['minimal'],
    sizes: ['36', '37', '38', '39', '40'],
    temperature_range_c: { min_c: 18, max_c: 42 },
    image_url:
      'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=900&q=80',
    kind: 'shoe',
    tile: Colors.light.cream,
  }),

  product({
    id: 'mkt-tee-01',
    name: 'Soft White Tee',
    price: 32,
    brand: 'Orbit',
    category: 'Tops',
    subcategory: 't-shirt',
    museCategory: 'tops',
    formality: 'casual',
    colors: { primary: 'white' },
    style_tags: ['minimal'],
    sizes: ['S', 'M', 'L', 'XL'],
    temperature_range_c: { min_c: 16, max_c: 36 },
    image_url:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    kind: 'shirt',
  }),
  product({
    id: 'mkt-tee-02',
    name: 'Everyday Rust Tee',
    price: 38,
    brand: 'Morrow',
    category: 'Tops',
    subcategory: 't-shirt',
    museCategory: 'tops',
    formality: 'casual',
    colors: { primary: 'rust' },
    style_tags: ['casual'],
    sizes: ['S', 'M', 'L'],
    temperature_range_c: { min_c: 14, max_c: 34 },
    image_url:
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80',
    kind: 'shirt',
    tile: Colors.light.rustTile,
  }),
  product({
    id: 'mkt-shirt-01',
    name: 'Crisp Oxford Shirt',
    price: 75,
    brand: 'Line',
    category: 'Tops',
    subcategory: 'shirt',
    museCategory: 'tops',
    formality: 'formal',
    colors: { primary: 'white' },
    style_tags: ['classic'],
    sizes: ['S', 'M', 'L'],
    temperature_range_c: { min_c: 8, max_c: 30 },
    image_url:
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80',
    kind: 'shirt',
  }),
  product({
    id: 'mkt-blouse-01',
    name: 'Silk Sand Blouse',
    price: 88,
    brand: 'Atelier',
    category: 'Tops',
    subcategory: 'blouse',
    museCategory: 'tops',
    formality: 'smart-casual',
    gender: 'female',
    colors: { primary: 'beige' },
    style_tags: ['elegant', 'classic'],
    sizes: ['XS', 'S', 'M', 'L'],
    temperature_range_c: { min_c: 10, max_c: 30 },
    image_url:
      'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=900&q=80',
    kind: 'shirt',
    tile: Colors.light.cream,
  }),
  product({
    id: 'mkt-sweater-01',
    name: 'Cable Knit Cream',
    price: 96,
    brand: 'Hearth',
    category: 'Tops',
    subcategory: 'sweater',
    museCategory: 'tops',
    formality: 'casual',
    colors: { primary: 'cream' },
    style_tags: ['classic'],
    sizes: ['S', 'M', 'L'],
    temperature_range_c: { min_c: -2, max_c: 16 },
    image_url:
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80',
    kind: 'shirt',
    tile: Colors.light.sandTile,
  }),
  product({
    id: 'mkt-hoodie-01',
    name: 'City Grey Hoodie',
    price: 64,
    brand: 'North',
    category: 'Tops',
    subcategory: 'hoodie',
    museCategory: 'tops',
    formality: 'casual',
    colors: { primary: 'grey' },
    style_tags: ['street'],
    sizes: ['S', 'M', 'L', 'XL'],
    temperature_range_c: { min_c: 0, max_c: 18 },
    image_url:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    kind: 'shirt',
  }),

  product({
    id: 'mkt-jeans-01',
    name: 'Straight Indigo Jean',
    price: 68,
    brand: 'North',
    category: 'Bottoms',
    subcategory: 'jeans',
    museCategory: 'bottoms',
    formality: 'casual',
    colors: { primary: 'blue' },
    style_tags: ['street', 'minimal'],
    sizes: ['28', '30', '32', '34'],
    temperature_range_c: { min_c: 5, max_c: 30 },
    image_url:
      'https://images.unsplash.com/photo-1542272454315-7f6b6f66bf8f?auto=format&fit=crop&w=900&q=80',
    kind: 'pants',
  }),
  product({
    id: 'mkt-trouser-01',
    name: 'Black Tailored Trouser',
    price: 110,
    brand: 'Atelier',
    category: 'Bottoms',
    subcategory: 'trousers',
    museCategory: 'bottoms',
    formality: 'formal',
    colors: { primary: 'black' },
    style_tags: ['classic'],
    sizes: ['28', '30', '32', '34'],
    temperature_range_c: { min_c: 0, max_c: 26 },
    image_url:
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80',
    kind: 'pants',
  }),
  product({
    id: 'mkt-shorts-01',
    name: 'Linen Summer Short',
    price: 48,
    brand: 'Orbit',
    category: 'Bottoms',
    subcategory: 'shorts',
    museCategory: 'bottoms',
    formality: 'casual',
    colors: { primary: 'beige' },
    style_tags: ['minimal'],
    sizes: ['28', '30', '32', '34'],
    temperature_range_c: { min_c: 18, max_c: 40 },
    image_url:
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=900&q=80',
    kind: 'pants',
    tile: Colors.light.cream,
  }),
  product({
    id: 'mkt-skirt-01',
    name: 'Pleat Midi Skirt',
    price: 72,
    brand: 'Line',
    category: 'Bottoms',
    subcategory: 'skirt',
    museCategory: 'bottoms',
    formality: 'smart-casual',
    gender: 'female',
    colors: { primary: 'navy' },
    style_tags: ['classic', 'elegant'],
    sizes: ['XS', 'S', 'M', 'L'],
    temperature_range_c: { min_c: 12, max_c: 30 },
    image_url:
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=900&q=80',
    kind: 'pants',
  }),

  product({
    id: 'mkt-raincoat-01',
    name: 'City Rain Shell',
    price: 128,
    brand: 'North',
    category: 'Outerwear',
    subcategory: 'raincoat',
    museCategory: 'outerwear',
    formality: 'casual',
    colors: { primary: 'navy' },
    style_tags: ['minimal', 'street'],
    sizes: ['S', 'M', 'L', 'XL'],
    temperature_range_c: { min_c: 4, max_c: 22 },
    image_url:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',
    kind: 'outer',
  }),
  product({
    id: 'mkt-jacket-01',
    name: 'Olive Utility Jacket',
    price: 118,
    brand: 'Morrow',
    category: 'Outerwear',
    subcategory: 'jacket',
    museCategory: 'outerwear',
    formality: 'casual',
    colors: { primary: 'olive' },
    style_tags: ['street', 'minimal'],
    sizes: ['S', 'M', 'L'],
    temperature_range_c: { min_c: 2, max_c: 20 },
    image_url:
      'https://images.unsplash.com/photo-1495107334309-fcf795c6f2f0?auto=format&fit=crop&w=900&q=80',
    kind: 'outer',
    tile: Colors.light.oliveTile,
  }),
  product({
    id: 'mkt-blazer-01',
    name: 'Navy Soft Blazer',
    price: 160,
    brand: 'Line',
    category: 'Outerwear',
    subcategory: 'blazer',
    museCategory: 'outerwear',
    formality: 'smart-casual',
    colors: { primary: 'navy' },
    style_tags: ['classic', 'smart'],
    sizes: ['S', 'M', 'L'],
    temperature_range_c: { min_c: 5, max_c: 22 },
    // Single blazer still — not a three-piece suit shoot.
    image_url:
      'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&w=900&q=80',
    kind: 'outer',
  }),
  product({
    id: 'mkt-coat-01',
    name: 'Camel Wool Coat',
    price: 210,
    brand: 'Hearth',
    category: 'Outerwear',
    subcategory: 'coat',
    museCategory: 'outerwear',
    formality: 'smart-casual',
    colors: { primary: 'beige' },
    style_tags: ['classic'],
    sizes: ['S', 'M', 'L'],
    temperature_range_c: { min_c: -5, max_c: 14 },
    image_url:
      'https://images.unsplash.com/photo-1539533018447-63fcba339dff?auto=format&fit=crop&w=900&q=80',
    kind: 'outer',
    tile: Colors.light.sand,
  }),

  product({
    id: 'mkt-dress-01',
    name: 'Midnight Slip Dress',
    price: 145,
    brand: 'Atelier',
    category: 'Dresses',
    subcategory: 'dress',
    museCategory: 'one-piece',
    formality: 'formal',
    gender: 'female',
    colors: { primary: 'black' },
    style_tags: ['elegant'],
    sizes: ['XS', 'S', 'M'],
    temperature_range_c: { min_c: 12, max_c: 32 },
    image_url:
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
    kind: 'dress',
  }),
  product({
    id: 'mkt-dress-02',
    name: 'Sun Linen Dress',
    price: 98,
    gender: 'female',
    brand: 'Orbit',
    category: 'Dresses',
    subcategory: 'dress',
    museCategory: 'one-piece',
    formality: 'casual',
    colors: { primary: 'yellow' },
    style_tags: ['minimal'],
    sizes: ['XS', 'S', 'M', 'L'],
    temperature_range_c: { min_c: 16, max_c: 36 },
    image_url:
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80',
    kind: 'dress',
    tile: Colors.light.cream,
  }),

  product({
    id: 'mkt-bag-01',
    name: 'Cognac Day Tote',
    price: 95,
    brand: 'Morrow',
    category: 'Bags',
    subcategory: 'bag',
    museCategory: 'accessories',
    formality: 'smart-casual',
    colors: { primary: 'brown' },
    style_tags: ['classic'],
    sizes: ['OS'],
    temperature_range_c: { min_c: -10, max_c: 40 },
    image_url:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80',
    kind: 'bag',
    tile: Colors.light.sandTile,
  }),
  product({
    id: 'mkt-bag-02',
    name: 'City Mini Crossbody',
    price: 54,
    brand: 'Orbit',
    category: 'Bags',
    subcategory: 'bag',
    museCategory: 'accessories',
    formality: 'casual',
    colors: { primary: 'black' },
    style_tags: ['minimal', 'street'],
    sizes: ['OS'],
    temperature_range_c: { min_c: -10, max_c: 40 },
    image_url:
      'https://images.unsplash.com/photo-1590874103328-eac38a67478a?auto=format&fit=crop&w=900&q=80',
    kind: 'bag',
  }),
  product({
    id: 'mkt-bag-03',
    name: 'Canvas Weekender',
    price: 120,
    brand: 'North',
    category: 'Bags',
    subcategory: 'bag',
    museCategory: 'accessories',
    formality: 'casual',
    colors: { primary: 'beige' },
    style_tags: ['street'],
    sizes: ['OS'],
    temperature_range_c: { min_c: -10, max_c: 40 },
    image_url:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
    kind: 'bag',
    tile: Colors.light.cream,
  }),

  product({
    id: 'mkt-scarf-01',
    name: 'Olive Merino Scarf',
    price: 45,
    brand: 'Hearth',
    category: 'Accessories',
    subcategory: 'scarf',
    museCategory: 'accessories',
    formality: 'casual',
    colors: { primary: 'olive' },
    style_tags: ['classic'],
    sizes: ['OS'],
    temperature_range_c: { min_c: -5, max_c: 16 },
    image_url:
      'https://images.unsplash.com/photo-1520903920245-00d872fea73d?auto=format&fit=crop&w=900&q=80',
    kind: 'accessory',
    tile: Colors.light.oliveTile,
  }),
  product({
    id: 'mkt-scarf-02',
    name: 'Cashmere Soft Wrap',
    price: 78,
    brand: 'Atelier',
    category: 'Accessories',
    subcategory: 'scarf',
    museCategory: 'accessories',
    formality: 'smart-casual',
    colors: { primary: 'grey' },
    style_tags: ['elegant'],
    sizes: ['OS'],
    temperature_range_c: { min_c: -8, max_c: 14 },
    image_url:
      'https://images.unsplash.com/photo-1601924994987-69e26a50c3a0?auto=format&fit=crop&w=900&q=80',
    kind: 'accessory',
  }),
  product({
    id: 'mkt-hat-01',
    name: 'Felt Fedora',
    price: 52,
    brand: 'Line',
    category: 'Accessories',
    subcategory: 'hat',
    museCategory: 'accessories',
    formality: 'smart-casual',
    colors: { primary: 'brown' },
    style_tags: ['classic'],
    sizes: ['OS'],
    temperature_range_c: { min_c: -4, max_c: 28 },
    image_url:
      'https://images.unsplash.com/photo-1514327605112-b785a0e9ceec?auto=format&fit=crop&w=900&q=80',
    kind: 'accessory',
    tile: Colors.light.sand,
  }),
  product({
    id: 'mkt-glasses-01',
    name: 'Acetate Sun Frame',
    price: 86,
    brand: 'Orbit',
    category: 'Accessories',
    subcategory: 'other-accessories',
    museCategory: 'accessories',
    formality: 'casual',
    colors: { primary: 'black' },
    style_tags: ['minimal', 'street'],
    sizes: ['OS'],
    temperature_range_c: { min_c: -10, max_c: 42 },
    image_url:
      'https://images.unsplash.com/photo-1511499767150-a48a237ac008?auto=format&fit=crop&w=900&q=80',
    kind: 'accessory',
  }),
  product({
    id: 'mkt-belt-01',
    name: 'Leather Everyday Belt',
    price: 42,
    brand: 'Morrow',
    category: 'Accessories',
    subcategory: 'belt',
    museCategory: 'accessories',
    formality: 'smart-casual',
    colors: { primary: 'brown' },
    style_tags: ['classic'],
    sizes: ['S', 'M', 'L'],
    temperature_range_c: { min_c: -10, max_c: 40 },
    image_url:
      'https://images.unsplash.com/photo-1624222247344-550fb60583fd?auto=format&fit=crop&w=900&q=80',
    kind: 'accessory',
    tile: Colors.light.sandTile,
  }),
  product({
    id: 'mkt-gloves-01',
    name: 'Winter Leather Gloves',
    price: 55,
    brand: 'Hearth',
    category: 'Accessories',
    subcategory: 'gloves',
    museCategory: 'accessories',
    formality: 'casual',
    colors: { primary: 'black' },
    style_tags: ['classic'],
    sizes: ['S', 'M', 'L'],
    temperature_range_c: { min_c: -18, max_c: 8 },
    image_url:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80',
    kind: 'accessory',
  }),
];

export const shopCategories: ShopCategory[] = [
  'Shoes',
  'Tops',
  'Bottoms',
  'Outerwear',
  'Dresses',
  'Bags',
  'Accessories',
];

export const shopBrands = [
  { name: 'Orbit', mark: 'O' },
  { name: 'Morrow', mark: 'M' },
  { name: 'North', mark: 'N' },
  { name: 'Line', mark: 'L' },
  { name: 'Atelier', mark: 'A' },
  { name: 'Hearth', mark: 'H' },
];

export function shopProductById(id: string) {
  return shopCatalog.find((item) => item.id === id);
}

function normalizeGender(value?: string | null): 'male' | 'female' | 'unisex' | null {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  if (['male', 'man', 'men', 'masculine', 'm'].includes(raw)) return 'male';
  if (['female', 'woman', 'women', 'feminine', 'f'].includes(raw)) return 'female';
  if (['unisex', 'all', 'any', 'nonbinary', 'non-binary', 'nb'].includes(raw)) {
    return 'unisex';
  }
  return null;
}

export function catalogForGender(gender?: string | null): ShopProduct[] {
  const g = normalizeGender(gender);
  return shopCatalog.filter((item) => {
    if (!item.in_stock) return false;
    if (!g || g === 'unisex') return true;
    return item.gender === 'unisex' || item.gender === g;
  });
}

/** Muse-ready marketplace payload from the same ecommerce catalog. */
export function toMuseMarketplaceProducts(gender?: string | null): MuseGarment[] {
  return catalogForGender(gender).map((item) => ({
    id: item.id,
    name: item.name,
    category: item.museCategory,
    subcategory: item.subcategory,
    colors: item.colors,
    formality: item.formality,
    style_tags: item.style_tags,
    price: item.price,
    currency: 'USD',
    sizes: item.sizes,
    brand: item.brand,
    in_stock: item.in_stock,
    source: 'marketplace' as const,
    gender: item.gender,
    temperature_range_c: item.temperature_range_c,
    image_url: item.image_url,
  }));
}
