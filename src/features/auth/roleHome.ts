export function roleHome(isAdmin: boolean, brandId: string | null) {
  if (isAdmin) return '/admin/brands' as const;
  if (brandId) return '/brand/catalog' as const;
  return '/home' as const;
}
