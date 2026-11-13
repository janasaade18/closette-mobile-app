import { supabase } from '@/lib/supabase';
import type { BrandRow } from '@/lib/database.types';

export type ClientRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: 'admin' | 'user';
  created_at: string;
  disabled_at: string | null;
};

async function invoke<T>(name: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<T & { error?: string }>(name, { body });
  if (error) {
    const response = 'context' in error ? error.context : null;
    if (response instanceof Response) {
      try {
        const payload = (await response.json()) as { error?: string };
        if (payload.error) throw new Error(payload.error);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== error.message) throw parseError;
      }
    }
    throw new Error(error.message || 'Admin request failed.');
  }
  if (data?.error) throw new Error(data.error);
  if (!data) throw new Error('Admin request failed.');
  return data;
}

export async function createBrandAccount(input: {
  name: string;
  description: string;
  email: string;
  password: string;
}) {
  const data = await invoke<{
    brand: BrandRow;
    ownerEmail: string;
    temporaryPassword: string;
  }>('create-brand', input);
  return {
    brand: data.brand,
    ownerEmail: data.ownerEmail,
    temporaryPassword: data.temporaryPassword,
  };
}

export async function resetBrandPassword(brandId: string, password: string) {
  const { data: brand, error } = await supabase
    .from('brands')
    .select('owner_user_id')
    .eq('id', brandId)
    .maybeSingle();
  if (error) throw error;
  if (!brand?.owner_user_id) throw new Error('Brand not found.');
  const result = await invoke<{ ownerEmail: string | null; temporaryPassword: string }>(
    'reset-user-password',
    { userId: brand.owner_user_id, password },
  );
  return {
    ownerEmail: result.ownerEmail,
    temporaryPassword: result.temporaryPassword,
  };
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
  return invoke<{ user: ClientRow; temporaryPassword: string }>('create-user', input);
}

export async function setClientActive(userId: string, active: boolean) {
  const data = await invoke<{ user: ClientRow }>('delete-user', { userId, active });
  return data.user;
}

export async function resetClientPassword(userId: string, password: string) {
  return invoke<{ ownerEmail: string | null; temporaryPassword: string }>('reset-user-password', {
    userId,
    password,
  });
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
