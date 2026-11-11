export type ClosetGarment = {
  id: string;
  profile_id: string;
  category: string | null;
  subcategory: string | null;
  confidence: number | null;
  color: {
    primary?: { name?: string; hex?: string; proportion?: number };
    secondary?: Array<{ name?: string; hex?: string; proportion?: number }>;
    is_multicolor?: boolean;
  } | null;
  pattern: { primary?: string; confidence?: number } | null;
  texture: { primary?: string; confidence?: number } | null;
  bbox: number[] | null;
  cutout_path: string;
  cutout_url: string | null;
  lighting: unknown;
  model_version: string | null;
  type_model_version: string | null;
  created_at: string;
};
