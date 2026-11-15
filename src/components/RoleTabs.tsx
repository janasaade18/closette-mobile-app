import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Typeface } from '@/constants/theme';

export function RoleTabs({
  tabs,
}: {
  tabs: { href: '/admin/brands' | '/admin/users' | '/admin/profile' | '/brand/catalog' | '/brand/profile'; label: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.positioner, { bottom: Math.max(insets.bottom + 8, 20) }]}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Pressable
              key={tab.href}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              onPress={() => router.navigate(tab.href)}
              style={styles.tab}>
              <Text style={[styles.label, active && styles.active]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  positioner: { position: 'absolute', left: 18, right: 18, alignItems: 'center' },
  bar: {
    width: '100%',
    maxWidth: 520,
    minHeight: 64,
    borderRadius: 32,
    paddingHorizontal: 8,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: { paddingHorizontal: 12, paddingVertical: 10 },
  label: { fontFamily: Typeface.body, fontSize: 14, color: Colors.light.onPrimaryMuted },
  active: { fontFamily: Typeface.bodyStrong, color: Colors.light.onPrimary },
});
