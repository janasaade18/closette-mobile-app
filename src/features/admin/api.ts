import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/features/auth/functions';
import type { BrandRow } from '@/lib/database.types';

export type ClientRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: 'admin' | 'user';
  created_at: string;
  disabled_at: string | null;
};

function invoke<T>(name: string, body: Record<string, unknown>) {
  return invokeFunction<T>(name, body);
}

export async function createBrandAccount(input: {
  name: string;
  description: string;
  email: string;
  password: string;
}) {
  const data = await invoke<{ brand: BrandRow; ownerEmail: string }>('create-brand', input);
  return { brand: data.brand, ownerEmail: data.ownerEmail };
}

export async function resetBrandPassword(brandId: string, password: string) {
  const { data: brand, error } = await supabase
    .from('brands')
    .select('owner_user_id')
    .eq('id', brandId)
    .maybeSingle();
  if (error) throw error;
  if (!brand?.owner_user_id) throw new Error('Brand not found.');
  return invoke<{ ownerEmail: string | null }>('reset-user-password', {
    userId: brand.owner_user_id,
    password,
  });
}

export async function setBrandActive(brandId: string, isActive: boolean) {
  const data = await invoke<{ brand: BrandRow }>('delete-brand', {
    brandId,
    active: isActive,
  });
  return data.brand;
}

export async function createClientAccount(input: {
  name: string;
  email: string;
  password: string;
}) {
  return invoke<{ user: ClientRow }>('create-user', input);
}

export async function setClientActive(userId: string, active: boolean) {
  const data = await invoke<{ user: ClientRow }>('delete-user', { userId, active });
  return data.user;
}

export async function resetClientPassword(userId: string, password: string) {
  return invoke<{ ownerEmail: string | null }>('reset-user-password', { userId, password });
}

export async function fetchAdminStats() {
  const [brands, users, products] = await Promise.all([
    supabase.from('brands').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('brand_products').select('id', { count: 'exact', head: true }),
  ]);
  if (brands.error) throw brands.error;
  if (users.error) throw users.error;
  if (products.error) throw products.error;
  return {
    brands: brands.count ?? 0,
    users: users.count ?? 0,
    products: products.count ?? 0,
  };
}

export async function fetchClients() {
  const [{ data: users, error: usersError }, { data: brands, error: brandsError }] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, display_name, role, created_at, disabled_at')
      .eq('role', 'user')
      .order('created_at', { ascending: false }),
    supabase.from('brands').select('owner_user_id'),
  ]);
  if (usersError) throw usersError;
  if (brandsError) throw brandsError;
  const owners = new Set((brands ?? []).map((brand) => brand.owner_user_id));
  return ((users ?? []) as ClientRow[]).filter((person) => !owners.has(person.id));
}
