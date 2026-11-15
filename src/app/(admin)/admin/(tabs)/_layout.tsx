import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RoleTabs } from '@/components/RoleTabs';
import { Colors } from '@/constants/theme';

export default function AdminTabsLayout() {
  return (
    <View style={styles.screen}>
      <Slot />
      <RoleTabs
        tabs={[
          { href: '/admin/brands', label: 'Brands' },
          { href: '/admin/users', label: 'Users' },
          { href: '/admin/profile', label: 'Profile' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.canvas },
});
