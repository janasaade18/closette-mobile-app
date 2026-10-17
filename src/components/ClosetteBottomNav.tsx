import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

export type ClosetteTab = 'home' | 'closet' | 'muse' | 'shop' | 'profile';

const tabs = [
  { key: 'home', label: 'Home', ios: 'house.fill', android: 'home' },
  { key: 'closet', label: 'Closet', ios: 'hanger', android: 'checkroom' },
  { key: 'muse', label: 'Muse', ios: 'sparkles', android: 'auto_awesome' },
  { key: 'shop', label: 'Shop', ios: 'bag.fill', android: 'shopping_bag' },
  { key: 'profile', label: 'Profile', ios: 'person.fill', android: 'person' },
] as const;

interface ClosetteBottomNavProps {
  activeTab: ClosetteTab;
  onTabPress: (tab: ClosetteTab) => void;
}

export default function ClosetteBottomNav({ activeTab, onTabPress }: ClosetteBottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.positioner, { bottom: Math.max(insets.bottom + 8, 20) }]}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              onPress={() => onTabPress(tab.key)}
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.pressed,
              ]}>
              <View style={[styles.iconHolder, active && styles.activeIconHolder]}>
                <SymbolView
                  name={{ ios: tab.ios, android: tab.android, web: tab.android }}
                  tintColor={active ? Colors.light.primary : Colors.light.onPrimaryMuted}
                  size={24}
                  style={styles.icon}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: 520,
    height: 74,
    borderRadius: 38,
    paddingHorizontal: 11,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#101C38',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHolder: {
    width: 50,
    height: 50,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconHolder: {
    backgroundColor: Colors.light.background,
  },
  icon: {
    width: 24,
    height: 24,
  },
  pressed: {
    opacity: 0.72,
  },
});
