import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

import { Colors, PageGutter, Typeface } from '@/constants/theme';

const accentOptions = [Colors.light.navySwatch, Colors.light.blueSlate, Colors.light.sand];

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const [accent, setAccent] = useState(accentOptions[0]);
  const [weatherEnabled, setWeatherEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const confirmLogout = () => Alert.alert('Log out?', 'You can sign in again whenever you want.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log out', style: 'destructive', onPress: () => router.replace('/sign-in') },
  ]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.topOrb} />
        <View pointerEvents="none" style={styles.bottomOrb} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Settings</Text>

          <Pressable accessibilityRole="button" onPress={() => Alert.alert('Profile', 'Profile editing is coming soon.')} style={styles.profileCard}>
            <View style={styles.avatar}><SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} tintColor={Colors.light.onPrimary} size={31} /></View>
            <View><Text style={styles.profileName}>Layla</Text><Text style={styles.profileSubtitle}>Minimal · Smart casual</Text></View>
          </Pressable>

          <View style={styles.settingCard}>
            <View style={styles.settingCopy}><Text style={styles.settingTitle}>Accent colour</Text><Text style={styles.settingSubtitle}>Make the app yours</Text></View>
            <View style={styles.accentOptions}>{accentOptions.map((option) => <Pressable key={option} accessibilityRole="button" accessibilityLabel={`Set accent colour ${option}`} accessibilityState={{ selected: accent === option }} onPress={() => setAccent(option)} style={[styles.accentOuter, accent === option && { borderColor: option }]}><View style={[styles.accentDot, { backgroundColor: option }]} /></Pressable>)}</View>
          </View>

          <Pressable accessibilityRole="button" onPress={() => Alert.alert('Style & fit', 'Your style, size, and occasion preferences will be available here.')} style={styles.settingCard}>
            <View style={styles.settingCopy}><Text style={styles.settingTitle}>Style &amp; fit</Text><Text style={styles.settingSubtitle}>Vibes, sizes, occasions</Text></View>
            <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={Colors.light.textSecondary} size={19} />
          </Pressable>

          <View style={styles.settingCard}>
            <View style={styles.settingCopy}><Text style={styles.settingTitle}>Weather location</Text><Text style={styles.settingSubtitle}>Use my city for outfits</Text></View>
            <Switch value={weatherEnabled} onValueChange={setWeatherEnabled} trackColor={{ false: Colors.light.outlineBlue, true: Colors.light.primary }} thumbColor={Colors.light.onPrimary} ios_backgroundColor={Colors.light.outlineBlue} />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingCopy}><Text style={styles.settingTitle}>Morning reminder</Text><Text style={styles.settingSubtitle}>8:00 AM</Text></View>
            <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ false: Colors.light.outlineBlue, true: Colors.light.primary }} thumbColor={Colors.light.onPrimary} ios_backgroundColor={Colors.light.outlineBlue} />
          </View>

          <Pressable accessibilityRole="button" onPress={() => Alert.alert('Privacy & data', 'Your closet belongs to you. You can manage your data and privacy choices here.')} style={styles.settingCard}>
            <View style={styles.settingCopy}><Text style={styles.settingTitle}>Privacy &amp; data</Text><Text style={styles.settingSubtitle}>You own your closet data</Text></View>
            <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={Colors.light.textSecondary} size={19} />
          </Pressable>

          <Pressable accessibilityRole="button" onPress={confirmLogout} style={styles.settingCard}>
            <Text style={styles.settingTitle}>Log out</Text>
            <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={Colors.light.textSecondary} size={19} />
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.canvas },
  screen: { flex: 1, overflow: 'hidden', backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 18, paddingBottom: 132, gap: 10 },
  topOrb: { position: 'absolute', width: 120, height: 120, borderRadius: 60, right: -42, top: -58, backgroundColor: Colors.light.warmOrb },
  bottomOrb: { position: 'absolute', width: 270, height: 270, borderRadius: 135, left: -118, top: '62%', backgroundColor: Colors.light.coolOrb },
  title: { color: Colors.light.primary, fontFamily: Typeface.display, fontSize: 34, lineHeight: 44, marginBottom: 7 },
  profileCard: { minHeight: 99, borderRadius: 30, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: Colors.light.primary, marginBottom: 9 },
  avatar: { width: 65, height: 65, borderRadius: 33, backgroundColor: Colors.light.softBlue, alignItems: 'center', justifyContent: 'center' },
  profileName: { color: Colors.light.onPrimary, fontFamily: Typeface.display, fontSize: 22 },
  profileSubtitle: { color: Colors.light.onPrimary, fontFamily: Typeface.body, fontSize: 13 },
  settingCard: { minHeight: 72, borderRadius: 27, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: Colors.light.backgroundElement },
  settingCopy: { flex: 1 },
  settingTitle: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 16 },
  settingSubtitle: { color: Colors.light.textSecondary, fontFamily: Typeface.body, fontSize: 13, marginTop: 1 },
  accentOptions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  accentOuter: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  accentDot: { width: 26, height: 26, borderRadius: 13 },
});
