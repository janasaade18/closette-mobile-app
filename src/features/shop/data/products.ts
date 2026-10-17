import { Colors } from '@/constants/theme';

export type ShopCategory = 'Shoes' | 'Tops' | 'Bottoms' | 'Bags';
export type ShopProduct = {
  name: string;
  price: number;
  brand: string;
  mark: string;
  category: ShopCategory;
  tone: string;
  tile: string;
  kind: 'shoe' | 'shirt' | 'pants' | 'bag';
};

export const shopProducts: ShopProduct[] = [
  { name: 'Trail Low', price: 74, brand: 'North', mark: 'N', category: 'Shoes', tone: Colors.light.sand, tile: Colors.light.softBlue, kind: 'shoe' },
  { name: 'Loop', price: 65, brand: 'Morrow', mark: 'M', category: 'Shoes', tone: Colors.light.blueSlate, tile: Colors.light.sand, kind: 'shoe' },
  { name: 'Cloud', price: 89, brand: 'Orbit', mark: 'O', category: 'Shoes', tone: Colors.light.background, tile: Colors.light.softBlue, kind: 'shoe' },
  { name: 'Court', price: 79, brand: 'Line', mark: '///', category: 'Shoes', tone: Colors.light.navySwatch, tile: Colors.light.sand, kind: 'shoe' },
  { name: 'Everyday tee', price: 38, brand: 'Morrow', mark: 'M', category: 'Tops', tone: Colors.light.rust, tile: Colors.light.rustTile, kind: 'shirt' },
  { name: 'Linen shirt', price: 58, brand: 'North', mark: 'N', category: 'Tops', tone: Colors.light.navySwatch, tile: Colors.light.softBlue, kind: 'shirt' },
  { name: 'Wide trouser', price: 82, brand: 'Line', mark: '///', category: 'Bottoms', tone: Colors.light.olive, tile: Colors.light.oliveTile, kind: 'pants' },
  { name: 'City tote', price: 54, brand: 'Orbit', mark: 'O', category: 'Bags', tone: Colors.light.rust, tile: Colors.light.rustTile, kind: 'bag' },
];
