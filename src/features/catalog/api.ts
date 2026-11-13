import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';
import type { BrandProductRow, BrandRow } from '@/lib/database.types';
import type { MuseGarment } from '@/features/muse/services/museApi';

import type { CatalogBrand, CatalogProduct } from './types';

export const BRAND_IMAGE_BUCKET = 'brand-product-images';

const productsById = new Map<string, CatalogProduct>();

export function catalogProductById(id: string) {
  return productsById.get(id);
}

export function rememberProducts(products: CatalogProduct[]) {
  for (const product of products) {
    productsById.set(product.id, product);
  }
}

export function brandImageUrl(path: string | null, version?: string | null) {
  if (!path) return null;
  const base = supabase.storage.from(BRAND_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  if (!version) return base;
  return `${base}?v=${encodeURIComponent(version)}`;
}

export function mapBrand(row: BrandRow): CatalogBrand {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    logoUrl: brandImageUrl(row.logo_url, row.logo_url),
    ownerUserId: row.owner_user_id,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function money(value: number | string | null) {
  if (value == null || value === '') return null;
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

export function mapProduct(row: BrandProductRow, brandName: string): CatalogProduct {
  return {
    id: row.id,
    brandId: row.brand_id,
    brandName,
    name: row.name,
    description: row.description,
    price: money(row.price),
    category: row.category,
    imagePath: row.image_path,
    imageUrl: brandImageUrl(row.image_path, row.updated_at),
    isActive: row.is_active,
    updatedAt: row.updated_at,
  };
}

type JoinedProduct = BrandProductRow & {
  brands: { name: string } | { name: string }[] | null;
};

function brandNameFromJoin(brands: JoinedProduct['brands']) {
  if (Array.isArray(brands)) return brands[0]?.name ?? 'Brand';
  return brands?.name ?? 'Brand';
}

export async function fetchActiveBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapBrand);
}

export async function fetchAllBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapBrand);
}

export async function fetchBrand(brandId: string) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', brandId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapBrand(data) : null;
}

export async function fetchActiveBrandProducts(brandId: string) {
  const { data, error } = await supabase
    .from('brand_products')
    .select('*, brands!inner(name)')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const products = ((data ?? []) as unknown as JoinedProduct[]).map((row) =>
    mapProduct(row, brandNameFromJoin(row.brands)),
  );
  rememberProducts(products);
  return products;
}

export async function fetchActiveCatalog() {
  const { data, error } = await supabase
    .from('brand_products')
    .select('*, brands!inner(name, is_active)')
    .eq('is_active', true)
    .eq('brands.is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const products = ((data ?? []) as unknown as JoinedProduct[]).map((row) =>
    mapProduct(row, brandNameFromJoin(row.brands)),
  );
  rememberProducts(products);
  return products;
}

export async function fetchOwnedProducts(brandId: string, brandName: string) {
  const { data, error } = await supabase
    .from('brand_products')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapProduct(row, brandName));
}

export async function pickCatalogImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Allow photo access to upload an image.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}

function decodeBase64(value: string) {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function uploadBrandImage(input: {
  brandId: string;
  fileName: string;
  uri: string;
  onProgress?: (value: number) => void;
}) {
  input.onProgress?.(0.15);
  const base64 = await FileSystem.readAsStringAsync(input.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  input.onProgress?.(0.45);
  const path = `${input.brandId}/${input.fileName}`;
  const { error } = await supabase.storage.from(BRAND_IMAGE_BUCKET).upload(path, decodeBase64(base64), {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  input.onProgress?.(0.85);
  return path;
}

export async function updateBrandProfile(input: {
  brandId: string;
  name: string;
  description: string | null;
  logoUri?: string | null;
  onProgress?: (value: number) => void;
}) {
  let logoPath: string | undefined;
  if (input.logoUri) {
    logoPath = await uploadBrandImage({
      brandId: input.brandId,
      fileName: 'logo.jpg',
      uri: input.logoUri,
      onProgress: input.onProgress,
    });
  }

  const { data, error } = await supabase
    .from('brands')
    .update({
      name: input.name,
      description: input.description,
      ...(logoPath ? { logo_url: logoPath } : {}),
    })
    .eq('id', input.brandId)
    .select('*')
    .single();

  if (error) throw error;
  input.onProgress?.(1);
  return mapBrand(data);
}

export async function createProduct(input: {
  brandId: string;
  brandName: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  imageUri: string;
  onProgress?: (value: number) => void;
}) {
  const id = globalThis.crypto.randomUUID();
  const imagePath = await uploadBrandImage({
    brandId: input.brandId,
    fileName: `${id}.jpg`,
    uri: input.imageUri,
    onProgress: input.onProgress,
  });

  const { data, error } = await supabase
    .from('brand_products')
    .insert({
      id,
      brand_id: input.brandId,
      name: input.name,
      description: input.description,
      price: input.price,
      category: input.category,
      image_path: imagePath,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) {
    await supabase.storage.from(BRAND_IMAGE_BUCKET).remove([imagePath]);
    throw error;
  }

  input.onProgress?.(1);
  const product = mapProduct(data, input.brandName);
  rememberProducts([product]);
  return product;
}

export async function updateProduct(input: {
  product: CatalogProduct;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  isActive: boolean;
  imageUri?: string | null;
  onProgress?: (value: number) => void;
}) {
  let imagePath = input.product.imagePath;
  if (input.imageUri) {
    imagePath = await uploadBrandImage({
      brandId: input.product.brandId,
      fileName: `${input.product.id}.jpg`,
      uri: input.imageUri,
      onProgress: input.onProgress,
    });
  }

  const { data, error } = await supabase
    .from('brand_products')
    .update({
      name: input.name,
      description: input.description,
      price: input.price,
      category: input.category,
      is_active: input.isActive,
      image_path: imagePath,
    })
    .eq('id', input.product.id)
    .select('*')
    .single();

  if (error) throw error;
  input.onProgress?.(1);
  const product = mapProduct(data, input.product.brandName);
  rememberProducts([product]);
  return product;
}

function museCategory(category: string | null) {
  const value = category?.toLowerCase() ?? '';
  if (value.includes('shoe')) return 'footwear';
  if (value.includes('outer') || value.includes('jacket') || value.includes('coat')) return 'outerwear';
  if (value.includes('bottom') || value.includes('pant') || value.includes('skirt')) return 'bottom';
  if (value.includes('dress')) return 'one_piece';
  if (value.includes('bag') || value.includes('accessor')) return 'accessory';
  return 'top';
}

export function toMuseProducts(products: CatalogProduct[]): MuseGarment[] {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    category: museCategory(product.category),
    subcategory: product.category,
    colors: { primary: 'unknown' },
    formality: 'casual',
    style_tags: product.category ? [product.category.toLowerCase()] : [],
    price: product.price ?? undefined,
    currency: 'USD',
    brand: product.brandName,
    in_stock: true,
    source: 'marketplace' as const,
    gender: 'unisex',
    temperature_range_c: { min_c: -5, max_c: 35 },
    image_url: product.imageUrl ?? undefined,
  }));
}

export async function fetchMuseMarketplaceProducts() {
  return toMuseProducts(await fetchActiveCatalog());
}

export async function deleteProduct(product: CatalogProduct) {
  const { error } = await supabase.from('brand_products').delete().eq('id', product.id);
  if (error) throw error;
  if (product.imagePath) {
    await supabase.storage.from(BRAND_IMAGE_BUCKET).remove([product.imagePath]);
  }
  productsById.delete(product.id);
}
