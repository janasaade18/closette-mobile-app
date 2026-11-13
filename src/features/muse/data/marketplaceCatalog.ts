import type { MuseGarment } from '@/features/muse/services/museApi';
import {
  shopCatalog,
  shopProductById,
  toMuseMarketplaceProducts,
  type ShopProduct,
} from '@/features/shop/data/catalog';

/** Same partner ecommerce catalog Muse Market mode uses. */
export type MarketplaceProduct = ShopProduct;

export const MARKETPLACE_CATALOG: MarketplaceProduct[] = shopCatalog;

export function marketplaceProductById(id: string) {
  return shopProductById(id);
}

export function museMarketplaceProducts(): MuseGarment[] {
  return toMuseMarketplaceProducts();
}
