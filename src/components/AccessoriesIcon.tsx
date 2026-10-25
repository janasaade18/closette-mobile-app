import { SymbolView } from 'expo-symbols';

export default function AccessoriesIcon({ size = 18, color = '#12263F' }: { size?: number; color?: string }) {
  return <SymbolView accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name={{ ios: 'applewatch', android: 'watch', web: 'watch' }} tintColor={color} size={size} />;
}
