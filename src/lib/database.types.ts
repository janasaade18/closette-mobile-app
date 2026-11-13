import type { ClosetGarment } from '@/features/closet/types';

export type UserRole = 'admin' | 'user';

export type UsersRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  age_range: string | null;
  gender: string | null;
  location: string | null;
  preferred_units: string | null;
  height_cm: string | null;
  top_size: string | null;
  bottom_size: string | null;
  accent_color: string | null;
  photo_url: string | null;
  weather_aware: boolean;
  preferred_styles: string[];
  preferred_colors: string[];
  preferred_clothing: string[];
  common_occasions: string[];
  onboarding_completed_at: string | null;
  role: UserRole;
  disabled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BrandRow = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  owner_user_id: string;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
};

export type BrandProductRow = {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  category: string | null;
  image_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<
  Row,
  Insert = Partial<Row>,
  Update = Partial<Row>,
  Relationships extends Relationship[] = [],
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

export type Database = {
  public: {
    Tables: {
      users: Table<UsersRow>;
      garments: Table<ClosetGarment>;
      brands: Table<BrandRow>;
      brand_products: Table<
        BrandProductRow,
        Partial<BrandProductRow>,
        Partial<BrandProductRow>,
        [
          {
            foreignKeyName: 'brand_products_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
        ]
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      current_brand_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
