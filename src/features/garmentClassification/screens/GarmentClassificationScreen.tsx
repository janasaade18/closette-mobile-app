import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, PageGutter, Typeface } from '@/constants/theme';

type ClassificationResult = {
  category: string;
  type: string;
  garment: string;
  confidence: number;
};

interface GarmentClassificationScreenProps {
  onBack?: () => void;
}

export default function GarmentClassificationScreen({
  onBack,
}: GarmentClassificationScreenProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!photo.canceled) {
      setImageUri(photo.assets[0].uri);
      setResult(null);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!picked.canceled) {
      setImageUri(picked.assets[0].uri);
      setResult(null);
    }
  };

  const analyzeGarment = async () => {
    if (!imageUri) {
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    // Temporary mock result.
    // This will be replaced with the backend API call.
    setTimeout(() => {
      setResult({
        category: 'CLOTHING',
        type: 'TOP',
        garment: 'T-shirt',
        confidence: 0.94,
      });

      setIsAnalyzing(false);
    }, 1500);
  };

  const canSort = Boolean(imageUri) && !isAnalyzing;

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          disabled={!onBack}
          hitSlop={8}
          style={styles.back}>
          <Text style={styles.backIcon}>{onBack ? '‹' : ''}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add a piece</Text>
        <Text style={styles.subtitle}>
          Photograph it, or choose one from your gallery. Closette tags its type,
          colour and vibe for you.
        </Text>

        <View style={styles.actions}>
          <Pressable style={styles.photoButton} onPress={takePhoto}>
            <Text style={styles.photoButtonText}>Take photo</Text>
          </Pressable>
          <Pressable style={styles.galleryButton} onPress={pickImage}>
            <Text style={styles.galleryButtonText}>Gallery</Text>
          </Pressable>
        </View>

        <View style={styles.frame}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderMark} />
              <Text style={styles.placeholderText}>Your photo will show up here</Text>
            </View>
          )}
        </View>

        {result ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{result.garment}</Text>
            <Text style={styles.resultBody}>
              {formatLabel(result.type)} · {formatLabel(result.category)}
            </Text>
            <View style={styles.confidence}>
              <Text style={styles.confidenceText}>
                {Math.round(result.confidence * 100)}% sure
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Pressable
        style={[styles.sortButton, !canSort && styles.sortButtonDisabled]}
        onPress={analyzeGarment}
        disabled={!canSort}>
        <Text style={[styles.sortButtonText, !canSort && styles.sortButtonTextDisabled]}>
          {isAnalyzing ? 'Sorting...' : 'Sort this piece'}
        </Text>
      </Pressable>
    </View>
  );
}

function formatLabel(value: string) {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.canvas,
    paddingHorizontal: PageGutter,
    paddingTop: 72,
  },
  topBar: {
    height: 36,
    justifyContent: 'center',
  },
  back: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    lineHeight: 28,
    color: Colors.light.primary,
    fontFamily: Typeface.displayMedium,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: Typeface.display,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    color: Colors.light.onPrimary,
    fontSize: 15,
    fontFamily: Typeface.display,
  },
  galleryButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryButtonText: {
    color: Colors.light.primary,
    fontSize: 15,
    fontFamily: Typeface.displayMedium,
  },
  frame: {
    height: 320,
    borderRadius: 28,
    backgroundColor: Colors.light.bubble,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  placeholderMark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.sand,
    marginBottom: 14,
  },
  placeholderText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
  },
  resultCard: {
    marginTop: 16,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 22,
    padding: 18,
  },
  resultTitle: {
    fontSize: 22,
    fontFamily: Typeface.display,
    color: Colors.light.text,
    marginBottom: 4,
  },
  resultBody: {
    fontSize: 15,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
  },
  confidence: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: Colors.light.bubble,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  confidenceText: {
    fontSize: 13,
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.primary,
  },
  sortButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sortButtonDisabled: {
    backgroundColor: Colors.light.bubble,
  },
  sortButtonText: {
    color: Colors.light.onPrimary,
    fontSize: 16,
    fontFamily: Typeface.display,
  },
  sortButtonTextDisabled: {
    color: Colors.light.textSecondary,
  },
});
