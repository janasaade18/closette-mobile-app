export const PRODUCT_CATEGORIES = [
  'Shoes',
  'Tops',
  'Bottoms',
  'Outerwear',
  'Dresses',
  'Bags',
  'Accessories',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const BRAND_CATEGORIES = ['Clothing', 'Shoes', 'Accessories', 'Mixed'] as const;
export type BrandCategory = (typeof BRAND_CATEGORIES)[number];

export type CatalogBrand = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  instagram: string | null;
  contactEmail: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  category: string | null;
  ownerUserId: string;
  isActive: boolean;
  createdAt: string;
};

export type CatalogProduct = {
  id: string;
  brandId: string;
  brandName: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  isActive: boolean;
  updatedAt: string;
};

export function formatPrice(price: number | null | undefined) {
  if (price == null || Number.isNaN(price)) return '';
  return `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
}
