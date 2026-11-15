import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { saveGarmentToCloset } from '@/features/closet/services/closetApi';
import {
  COLOR_OPTIONS,
  PATTERN_OPTIONS,
  TEXTURE_OPTIONS,
  analyzeGarmentAppearance,
  classifyGarment,
  displayName,
  fetchGarmentTaxonomy,
  statusCopy,
  submitGarmentCorrection,
  type GarmentAlternative,
  type GarmentAppearanceResult,
  type GarmentClassifyResult,
  type GarmentTaxonomyGroup,
} from '@/features/garmentClassification/services/garmentClassificationApi';

interface GarmentClassificationScreenProps {
  onBack?: () => void;
}

const FALLBACK_GROUPS: GarmentTaxonomyGroup[] = [
  {
    id: 'tops',
    name: 'Tops',
    types: ['t-shirt', 'shirt', 'polo', 'blouse', 'sweater', 'hoodie', 'tank-top', 'sweatshirt'],
  },
  {
    id: 'bottoms',
    name: 'Bottoms',
    types: ['jeans', 'trousers', 'chinos', 'shorts', 'skirt', 'leggings'],
  },
  {
    id: 'one-piece',
    name: 'One-piece',
    types: ['dress', 'jumpsuit', 'romper'],
  },
  {
    id: 'outerwear',
    name: 'Outerwear',
    types: ['jacket', 'coat', 'blazer', 'trench-coat', 'raincoat'],
  },
  {
    id: 'footwear',
    name: 'Footwear',
    types: ['sneakers', 'boots', 'sandals', 'formal-shoes', 'flats', 'heels'],
  },
  {
    id: 'accessories',
    name: 'Accessories',
    types: ['hat', 'scarf', 'belt', 'bag', 'gloves', 'other-accessories'],
  },
];

export default function GarmentClassificationScreen({
  onBack,
}: GarmentClassificationScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReadingLook, setIsReadingLook] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appearanceError, setAppearanceError] = useState<string | null>(null);
  const [result, setResult] = useState<GarmentClassifyResult | null>(null);
  const [appearance, setAppearance] = useState<GarmentAppearanceResult | null>(
    null,
  );
  const [selected, setSelected] = useState<{
    category: string;
    subcategory: string;
  } | null>(null);
  const [editedPattern, setEditedPattern] = useState<string | null>(null);
  const [editedTexture, setEditedTexture] = useState<string | null>(null);
  const [editedColor, setEditedColor] = useState<string | null>(null);
  const [taxonomyGroups, setTaxonomyGroups] =
    useState<GarmentTaxonomyGroup[]>(FALLBACK_GROUPS);

  const frameLayout = useMemo(() => ({ width: 0, height: 320 }), []);
  const appearanceGarment = appearance?.garments?.[0] ?? null;

  useEffect(() => {
    void fetchGarmentTaxonomy()
      .then((taxonomy) => {
        if (taxonomy.groups?.length) {
          setTaxonomyGroups(taxonomy.groups);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!appearanceGarment) {
      return;
    }
    setEditedPattern(appearanceGarment.pattern?.primary ?? null);
    setEditedTexture(appearanceGarment.texture?.primary ?? null);
    setEditedColor(appearanceGarment.color?.primary?.name ?? null);
  }, [appearanceGarment]);

  const loadAppearance = async (
    uri: string,
    next: GarmentClassifyResult,
  ) => {
    if (!next.subcategory || !next.bbox) {
      return;
    }
    setIsReadingLook(true);
    setAppearanceError(null);
    try {
      const looks = await analyzeGarmentAppearance(uri, {
        type: next.subcategory,
        group: next.category,
        confidence: next.confidence,
        box: next.bbox,
      });
      setAppearance(looks);
      if (looks.status === 'failed') {
        setAppearanceError(looks.error ?? 'Appearance could not be read.');
      }
    } catch (err) {
      setAppearanceError(
        err instanceof Error ? err.message : 'Appearance could not be read.',
      );
    } finally {
      setIsReadingLook(false);
    }
  };

  const analyzeUri = async (uri: string) => {
    setIsAnalyzing(true);
    setIsReadingLook(false);
    setResult(null);
    setAppearance(null);
    setSelected(null);
    setEditedPattern(null);
    setEditedTexture(null);
    setEditedColor(null);
    setError(null);
    setAppearanceError(null);

    try {
      const next = await classifyGarment(uri, { includeMask: false });
      setResult(next);
      if (next.category && next.subcategory) {
        setSelected({
          category: next.category,
          subcategory: next.subcategory,
        });
      }
      // Show type immediately — color/pattern can take longer on Nest.
      setIsAnalyzing(false);
      void loadAppearance(uri, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not classify this photo.');
      setIsAnalyzing(false);
    }
  };

  const usePickedAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setImageUri(asset.uri);
    setImageSize(
      asset.width && asset.height ? { width: asset.width, height: asset.height } : null,
    );
    setResult(null);
    setAppearance(null);
    setSelected(null);
    setError(null);
    setAppearanceError(null);
    await analyzeUri(asset.uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera', 'Allow camera access to photograph a garment.');
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.92,
    });

    if (!photo.canceled) {
      await usePickedAsset(photo.assets[0]);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Gallery', 'Allow photo library access to choose a garment.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.92,
    });

    if (!picked.canceled) {
      await usePickedAsset(picked.assets[0]);
    }
  };

  const analyzeGarment = async () => {
    if (!imageUri) {
      return;
    }
    await analyzeUri(imageUri);
  };

  const chooseAlternative = (alternative: GarmentAlternative) => {
    setSelected({
      category: alternative.category,
      subcategory: alternative.subcategory,
    });
  };

  const typeOptions = useMemo(() => {
    const group = taxonomyGroups.find((item) => item.id === selected?.category);
    return group?.types ?? [];
  }, [taxonomyGroups, selected?.category]);

  const selectCategory = (categoryId: string) => {
    const group = taxonomyGroups.find((item) => item.id === categoryId);
    const nextType =
      group?.types.includes(selected?.subcategory ?? '')
        ? selected!.subcategory
        : group?.types[0];
    if (!nextType) {
      return;
    }
    setSelected({ category: categoryId, subcategory: nextType });
  };

  const confirmSelection = async () => {
    if (!result || !selected || !imageUri) {
      return;
    }
    if (!user?.id) {
      Alert.alert('Sign in required', 'Sign in again, then save this piece to your closet.');
      return;
    }

    const predictedPattern = appearanceGarment?.pattern?.primary ?? null;
    const predictedTexture = appearanceGarment?.texture?.primary ?? null;
    const predictedColor = appearanceGarment?.color?.primary?.name ?? null;
    const typeChanged =
      selected.subcategory !== result.subcategory ||
      selected.category !== result.category;
    const lookChanged =
      (editedPattern && editedPattern !== predictedPattern) ||
      (editedTexture && editedTexture !== predictedTexture) ||
      (editedColor && editedColor !== predictedColor);

    setIsSaving(true);
    try {
      if (typeChanged || lookChanged) {
        await submitGarmentCorrection({
          image_id: `mobile-${Date.now()}`,
          predicted_category: result.category,
          predicted_subcategory: result.subcategory,
          corrected_category: selected.category,
          corrected_subcategory: selected.subcategory,
          confidence: result.confidence,
          model_version: result.model_version,
          predicted_pattern: predictedPattern,
          corrected_pattern: editedPattern,
          predicted_texture: predictedTexture,
          corrected_texture: editedTexture,
          predicted_color: predictedColor,
          corrected_color: editedColor,
        });
      }

      await saveGarmentToCloset(imageUri, user.id);
      Alert.alert(
        'Saved to closet',
        `${displayName(selected.subcategory)} is now in My closet.`,
      );
      onBack?.();
    } catch (err) {
      Alert.alert(
        'Could not save to closet',
        err instanceof Error ? err.message : 'Try again in a moment.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const canSort = Boolean(imageUri) && !isAnalyzing;
  const showConfirm = Boolean(result) && Boolean(selected);

  const primaryCta = showConfirm ? (
    <Pressable
      style={[styles.sortButton, isSaving && styles.sortButtonDisabled]}
      onPress={confirmSelection}
      disabled={isSaving}>
      <Text style={styles.sortButtonText}>
        {isSaving ? 'Saving to closet…' : 'Save to closet'}
      </Text>
    </Pressable>
  ) : (
    <Pressable
      style={[styles.sortButton, !canSort && styles.sortButtonDisabled]}
      onPress={analyzeGarment}
      disabled={!canSort}>
      <Text style={[styles.sortButtonText, !canSort && styles.sortButtonTextDisabled]}>
        {isAnalyzing ? 'Sorting…' : imageUri ? 'Sort this piece' : 'Take a photo first'}
      </Text>
    </Pressable>
  );

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, 24) + 12,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}>
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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add a piece</Text>
        <Text style={styles.subtitle}>
          Photograph one garment, or pick it from your gallery. Closette names the
          category and type.
        </Text>

        <View style={styles.actions}>
          <Pressable style={styles.photoButton} onPress={takePhoto}>
            <Text style={styles.photoButtonText}>Take photo</Text>
          </Pressable>
          <Pressable style={styles.galleryButton} onPress={pickImage}>
            <Text style={styles.galleryButtonText}>Gallery</Text>
          </Pressable>
        </View>

        <View
          style={styles.frame}
          onLayout={(event) => {
            frameLayout.width = event.nativeEvent.layout.width;
            frameLayout.height = event.nativeEvent.layout.height;
          }}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
              {result?.bbox && imageSize ? (
                <BBoxOverlay
                  bbox={result.bbox}
                  imageWidth={imageSize.width}
                  imageHeight={imageSize.height}
                  frameWidth={frameLayout.width || 1}
                  frameHeight={frameLayout.height || 320}
                />
              ) : null}
            </>
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderMark} />
              <Text style={styles.placeholderText}>Your photo will show up here</Text>
            </View>
          )}
          {isAnalyzing ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={Colors.light.onPrimary} size="large" />
              <Text style={styles.loadingText}>Reading the garment…</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.ctaInline}>{primaryCta}</View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not classify</Text>
            <Text style={styles.errorBody}>{error}</Text>
          </View>
        ) : null}

        {result ? (
          <View style={styles.resultCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusPill}>{result.status.toUpperCase()}</Text>
              {result.confidence != null ? (
                <Text style={styles.confidenceText}>
                  {Math.round(result.confidence * 100)}% sure
                </Text>
              ) : null}
            </View>

            <Text style={styles.resultTitle}>
              {displayName(selected?.subcategory ?? result.subcategory)}
            </Text>
            <Text style={styles.resultBody}>
              Edit anything Closette got wrong — corrections teach the model.
              {result.reason ? ` · ${result.reason.replace(/_/g, ' ')}` : ''}
            </Text>
            <Text style={styles.statusCopy}>{statusCopy(result)}</Text>

            <View style={styles.editBlock}>
              <Text style={styles.editLabel}>Category</Text>
              <View style={styles.editRow}>
                {taxonomyGroups.map((group) => {
                  const active = selected?.category === group.id;
                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => selectCategory(group.id)}
                      style={[styles.editChip, active && styles.editChipActive]}>
                      <Text
                        style={[
                          styles.editChipText,
                          active && styles.editChipTextActive,
                        ]}>
                        {group.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.editBlock}>
              <Text style={styles.editLabel}>Type</Text>
              <View style={styles.editRow}>
                {typeOptions.map((typeId) => {
                  const active = selected?.subcategory === typeId;
                  return (
                    <Pressable
                      key={typeId}
                      onPress={() =>
                        setSelected((current) =>
                          current
                            ? { ...current, subcategory: typeId }
                            : { category: result.category ?? 'tops', subcategory: typeId },
                        )
                      }
                      style={[styles.editChip, active && styles.editChipActive]}>
                      <Text
                        style={[
                          styles.editChipText,
                          active && styles.editChipTextActive,
                        ]}>
                        {displayName(typeId)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {result.alternatives && result.alternatives.length > 0 ? (
              <View style={styles.altBlock}>
                <Text style={styles.altLabel}>AI suggestions</Text>
                <View style={styles.altRow}>
                  {result.alternatives.map((alternative) => {
                    const active = selected?.subcategory === alternative.subcategory;
                    return (
                      <Pressable
                        key={`${alternative.subcategory}-${alternative.confidence}`}
                        onPress={() => chooseAlternative(alternative)}
                        style={[styles.altChip, active && styles.altChipActive]}>
                        <Text
                          style={[
                            styles.altChipText,
                            active && styles.altChipTextActive,
                          ]}>
                          {displayName(alternative.subcategory)}
                        </Text>
                        <Text
                          style={[
                            styles.altChipMeta,
                            active && styles.altChipTextActive,
                          ]}>
                          {Math.round(alternative.confidence * 100)}%
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {result.models?.classifier ? (
              <Text style={styles.modelMeta}>
                {result.models.classifier}
                {result.latency_ms != null ? ` · ${Math.round(result.latency_ms)} ms` : ''}
              </Text>
            ) : null}

            {isReadingLook ? (
              <View style={styles.lookBlock}>
                <View style={styles.lookLoadingRow}>
                  <ActivityIndicator color={Colors.light.primary} />
                  <Text style={styles.lookMeta}>Reading color & pattern…</Text>
                </View>
              </View>
            ) : null}

            {appearanceGarment ? (
              <View style={styles.lookBlock}>
                <Text style={styles.lookLabel}>Look</Text>
                {appearanceGarment.color?.primary ? (
                  <View style={styles.lookRow}>
                    <View
                      style={[
                        styles.swatch,
                        { backgroundColor: appearanceGarment.color.primary.hex },
                      ]}
                    />
                    <View style={styles.lookCopy}>
                      <Text style={styles.lookTitle}>
                        {displayName(editedColor ?? appearanceGarment.color.primary.name)}
                        {appearanceGarment.color.is_multicolor ? ' · multi' : ''}
                      </Text>
                      <Text style={styles.lookMeta}>
                        Pattern {displayName(editedPattern ?? appearanceGarment.pattern.primary)}
                        {' · '}
                        Texture {displayName(editedTexture ?? appearanceGarment.texture.primary)}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <Text style={styles.editLabel}>Color</Text>
                <View style={styles.editRow}>
                  {COLOR_OPTIONS.map((colorId) => {
                    const active = editedColor === colorId;
                    return (
                      <Pressable
                        key={colorId}
                        onPress={() => setEditedColor(colorId)}
                        style={[styles.editChip, active && styles.editChipActive]}>
                        <Text
                          style={[
                            styles.editChipText,
                            active && styles.editChipTextActive,
                          ]}>
                          {displayName(colorId)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.editLabel}>Pattern</Text>
                <View style={styles.editRow}>
                  {PATTERN_OPTIONS.map((patternId) => {
                    const active = editedPattern === patternId;
                    return (
                      <Pressable
                        key={patternId}
                        onPress={() => setEditedPattern(patternId)}
                        style={[styles.editChip, active && styles.editChipActive]}>
                        <Text
                          style={[
                            styles.editChipText,
                            active && styles.editChipTextActive,
                          ]}>
                          {displayName(patternId)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.editLabel}>Texture</Text>
                <View style={styles.editRow}>
                  {TEXTURE_OPTIONS.map((textureId) => {
                    const active = editedTexture === textureId;
                    return (
                      <Pressable
                        key={textureId}
                        onPress={() => setEditedTexture(textureId)}
                        style={[styles.editChip, active && styles.editChipActive]}>
                        <Text
                          style={[
                            styles.editChipText,
                            active && styles.editChipTextActive,
                          ]}>
                          {displayName(textureId)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {appearanceError ? (
              <Text style={styles.appearanceError}>{appearanceError}</Text>
            ) : null}

            {showConfirm ? <View style={styles.ctaInline}>{primaryCta}</View> : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function BBoxOverlay({
  bbox,
  imageWidth,
  imageHeight,
  frameWidth,
  frameHeight,
}: {
  bbox: number[];
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
}) {
  const [x1, y1, x2, y2] = bbox;
  const scale = Math.min(frameWidth / imageWidth, frameHeight / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const offsetX = (frameWidth - drawWidth) / 2;
  const offsetY = (frameHeight - drawHeight) / 2;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.bbox,
        {
          left: offsetX + x1 * scale,
          top: offsetY + y1 * scale,
          width: Math.max((x2 - x1) * scale, 1),
          height: Math.max((y2 - y1) * scale, 1),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.canvas,
    paddingHorizontal: PageGutter,
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
    // Clear the floating bottom nav so Sort / Confirm stays reachable.
    paddingBottom: 140,
  },
  ctaInline: {
    marginTop: 16,
    marginBottom: 8,
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
  bbox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.light.blueAccent,
    borderRadius: 8,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.light.cameraOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.bodyStrong,
    fontSize: 15,
  },
  errorCard: {
    marginTop: 16,
    backgroundColor: Colors.light.rustTile,
    borderRadius: 22,
    padding: 18,
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: Typeface.display,
    color: Colors.light.rust,
    marginBottom: 4,
  },
  errorBody: {
    fontSize: 14,
    fontFamily: Typeface.body,
    color: Colors.light.text,
  },
  resultCard: {
    marginTop: 16,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 22,
    padding: 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusPill: {
    fontSize: 11,
    letterSpacing: 0.6,
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.primary,
    backgroundColor: Colors.light.softBlue,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  confidenceText: {
    fontSize: 13,
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.primary,
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
  editBlock: {
    marginTop: 14,
  },
  editLabel: {
    fontSize: 13,
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  editRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editChip: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.canvas,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  editChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  editChipText: {
    fontSize: 13,
    fontFamily: Typeface.body,
    color: Colors.light.primary,
  },
  editChipTextActive: {
    color: Colors.light.onPrimary,
  },
  statusCopy: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Typeface.body,
    color: Colors.light.text,
  },
  altBlock: {
    marginTop: 16,
  },
  altLabel: {
    fontSize: 13,
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  altRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  altChip: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.bubble,
    minWidth: 96,
  },
  altChipActive: {
    backgroundColor: Colors.light.primary,
  },
  altChipText: {
    fontSize: 13,
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.primary,
  },
  altChipMeta: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
  },
  altChipTextActive: {
    color: Colors.light.onPrimary,
  },
  modelMeta: {
    marginTop: 14,
    fontSize: 12,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
  },
  lookBlock: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  lookLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lookLabel: {
    fontSize: 13,
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.textSecondary,
    marginBottom: 10,
  },
  lookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  lookCopy: {
    flex: 1,
  },
  lookTitle: {
    fontSize: 17,
    fontFamily: Typeface.display,
    color: Colors.light.text,
  },
  lookMeta: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
  },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  secondaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundElement,
  },
  swatchSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  secondaryText: {
    fontSize: 12,
    fontFamily: Typeface.body,
    color: Colors.light.primary,
  },
  appearanceError: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: Typeface.body,
    color: Colors.light.rust,
  },
  sortButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
