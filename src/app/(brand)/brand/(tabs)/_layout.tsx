import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RoleTabs } from '@/components/RoleTabs';
import { Colors } from '@/constants/theme';

export default function BrandTabsLayout() {
  return (
    <View style={styles.screen}>
      <Slot />
      <RoleTabs
        tabs={[
          { href: '/brand/catalog', label: 'Catalog' },
          { href: '/brand/profile', label: 'Profile' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.canvas },
});
