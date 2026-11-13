/**
 * Back-compat export — full ecommerce catalog lives in `catalog.ts`.
 * Miroir / chat still import `shopProducts` from here.
 */
export {
  shopCatalog as shopProducts,
  shopCategories,
  shopBrands,
  shopProductById,
  toMuseMarketplaceProducts,
  type ShopCategory,
  type ShopProduct,
} from './catalog';
