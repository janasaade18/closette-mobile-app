import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { PrimaryButton } from '@/features/brands/components/FormKit';

export function InactiveBrandNotice() {
  const { signOut } = useAuth();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>This brand is inactive</Text>
        <Text style={styles.bodyText}>
          An admin has turned this catalog off. You can open your profile, or sign out until the brand is active again.
        </Text>
        <PrimaryButton label="Log out" onPress={() => void signOut()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: PageGutter, gap: 12 },
  title: { fontFamily: Typeface.display, fontSize: 32, color: Colors.light.primary },
  bodyText: { fontFamily: Typeface.body, fontSize: 16, lineHeight: 22, color: Colors.light.textSecondary },
});
