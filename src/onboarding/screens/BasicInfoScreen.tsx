import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, Typeface } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import OnboardingHeader from '@/onboarding/components/OnboardingHeader';
import PreferenceChip from '@/onboarding/components/PreferenceChip';
import PrimaryButton from '@/onboarding/components/PrimaryButton';
import { useOnboarding } from '@/onboarding/OnboardingContext';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const AGE_RANGES = ['16-18', '19-24', '25-34', '35-44', '45+'];

interface BasicInfoScreenProps {
  onContinue: () => void;
  onBack?: () => void;
}

function resolveDisplayName(
  preferencesName: string | undefined,
  profileName: string | null | undefined,
  metadataName: unknown,
) {
  if (preferencesName?.trim()) return preferencesName.trim();
  if (profileName?.trim()) return profileName.trim();
  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim();
  }
  return '';
}

export default function BasicInfoScreen({
  onContinue,
  onBack,
}: BasicInfoScreenProps) {
  const { profile, user } = useAuth();
  const { preferences, updatePreferences } = useOnboarding();
  const [name, setName] = useState(
    resolveDisplayName(
      preferences.name,
      profile?.display_name,
      user?.user_metadata?.display_name,
    ),
  );
  const [location, setLocation] = useState(preferences.location ?? '');
  const [photoUri, setPhotoUri] = useState(preferences.photoUri);
  const [gender, setGender] = useState(preferences.gender ?? '');
  const [ageRange, setAgeRange] = useState(preferences.ageRange ?? '');


  useEffect(() => {
    const next = resolveDisplayName(
      preferences.name,
      profile?.display_name,
      user?.user_metadata?.display_name,
    );
    if (next && !name.trim()) {
      setName(next);
    }
  }, [preferences.name, profile?.display_name, user?.user_metadata?.display_name, name]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    updatePreferences({
      name,
      location,
      photoUri,
      ageRange: ageRange || undefined,
      gender: gender || undefined,
      preferredUnits: preferences.preferredUnits ?? 'Metric (cm / kg)',
    });
    onContinue();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingHeader
        step={1}
        title="Let's meet you"
        subtitle="Name, gender, and city — Muse uses these from day one for weather and shop picks."
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.camera}>
                <View style={styles.cameraBody} />
                <View style={styles.cameraLens} />
              </View>
            )}
          </View>
          <Pressable style={styles.addPhoto} onPress={pickPhoto}>
            <Text style={styles.addPhotoText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          placeholder="Layla"
          placeholderTextColor={Colors.light.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          placeholder="Beirut"
          placeholderTextColor={Colors.light.textSecondary}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.chips}>
          {GENDERS.map((option) => (
            <PreferenceChip
              key={option}
              label={option}
              selected={gender === option}
              onPress={() => setGender(option)}
            />
          ))}
        </View>

        <Text style={styles.label}>Age range</Text>
        <View style={styles.chips}>
          {AGE_RANGES.map((option) => (
            <PreferenceChip
              key={option}
              label={option}
              selected={ageRange === option}
              onPress={() => setAgeRange(option)}
            />
          ))}
        </View>
      </ScrollView>

      <PrimaryButton title="Continue" onPress={handleContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.canvas,
    paddingHorizontal: 24,
    paddingTop: 54,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
    alignItems: 'stretch',
  },
  avatarWrap: {
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.light.bubble,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: 112,
    height: 112,
  },
  camera: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBody: {
    width: 34,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  cameraLens: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  addPhoto: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 20,
    lineHeight: 22,
    color: Colors.light.primary,
    fontFamily: Typeface.displayMedium,
  },
  label: {
    fontSize: 13,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: Typeface.body,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundElement,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
