export interface UserPreferences {
  name?: string;
  ageRange?: string;
  gender?: string;
  location?: string;
  preferredUnits?: string;

  preferredStyles: string[];
  preferredColors: string[];
  preferredClothing: string[];
  commonOccasions: string[];

  heightCm?: string;
  topSize?: string;
  bottomSize?: string;
  weatherAware?: boolean;
  accentColor?: string;
  photoUri?: string;
}