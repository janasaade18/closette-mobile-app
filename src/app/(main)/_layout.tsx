import { Tabs, usePathname, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import ClosetteBottomNav, { type ClosetteTab } from '@/components/ClosetteBottomNav';
import { Colors } from '@/constants/theme';

export default function MainLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab: ClosetteTab = pathname.endsWith('/closet')
    ? 'closet'
    : pathname.endsWith('/muse')
      ? 'muse'
      : pathname.endsWith('/shop')
        ? 'shop'
        : pathname.endsWith('/profile')
          ? 'profile'
        : 'home';

  const handleTabPress = (tab: ClosetteTab) => {
    if (tab === 'home') router.navigate('/home');
    else if (tab === 'closet') router.navigate('/closet');
    else if (tab === 'muse') router.navigate('/muse');
    else if (tab === 'shop') router.navigate('/shop');
    else router.navigate('/profile');
  };

  return (
    <View style={styles.container}>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.hiddenTabBar, sceneStyle: styles.scene, freezeOnBlur: true }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="closet" />
        <Tabs.Screen name="muse" />
        <Tabs.Screen name="shop" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="muse-chat" options={{ href: null }} />
        <Tabs.Screen name="miroir" options={{ href: null }} />
      </Tabs>
      {!pathname.endsWith('/muse-chat') && !pathname.endsWith('/miroir') && <ClosetteBottomNav activeTab={activeTab} onTabPress={handleTabPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.canvas },
  scene: { backgroundColor: Colors.light.canvas },
  hiddenTabBar: { display: 'none' },
});
