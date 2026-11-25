import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { authErrorMessage } from '@/features/auth/userProfile';
import { resolveAutoPlace } from '@/features/muse/services/autoLocation';
import {
  createUserPlace,
  deleteUserPlace,
  ensureDetectedPlace,
  listUserPlaces,
  placeChipLabel,
  setActivePlace,
  updateUserPlace,
  type UserPlace,
} from '@/features/muse/services/userPlaces';

import {
  PlaceEditorModal,
  type PlaceEditorSave,
} from './PlaceEditorModal';

type Props = {
  visible: boolean;
  userId: string;
  onClose: () => void;
  /** Called after activate / create / edit / detect so parent can refresh weather. */
  onActivePlace: (place: UserPlace) => void;
};

export function PlacesManagerModal({
  visible,
  userId,
  onClose,
  onActivePlace,
}: Props) {
  const [places, setPlaces] = useState<UserPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<UserPlace | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setPlaces(await listUserPlaces(userId));
    } catch (error) {
      Alert.alert('Places', authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible) void reload();
  }, [visible, reload]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (place: UserPlace) => {
    setEditing(place);
    setEditorOpen(true);
  };

  const handleSave = async (input: PlaceEditorSave) => {
    try {
      setEditorOpen(false);
      if (editing) {
        const updated = await updateUserPlace({
          userId,
          placeId: editing.id,
          name: input.name,
          notes: input.notes || null,
          latitude: input.latitude,
          longitude: input.longitude,
        });
        await reload();
        if (updated.is_active) onActivePlace(updated);
      } else {
        const created = await createUserPlace({
          userId,
          name: input.name,
          notes: input.notes || null,
          latitude: input.latitude,
          longitude: input.longitude,
          makeActive: true,
        });
        await reload();
        onActivePlace(created);
      }
    } catch (error) {
      Alert.alert('Places', authErrorMessage(error));
    }
  };

  const activate = async (place: UserPlace) => {
    setBusyId(place.id);
    try {
      const next = await setActivePlace(userId, place.id);
      await reload();
      onActivePlace(next);
    } catch (error) {
      Alert.alert('Places', authErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const remove = (place: UserPlace) => {
    Alert.alert(
      'Delete place?',
      `Remove ${placeChipLabel(place)} from your saved places.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyId(place.id);
              try {
                const wasActive = place.is_active;
                await deleteUserPlace(userId, place.id);
                const next = await listUserPlaces(userId);
                setPlaces(next);
                if (wasActive && next[0]) {
                  const activated = await setActivePlace(userId, next[0].id);
                  onActivePlace(activated);
                  setPlaces(await listUserPlaces(userId));
                }
              } catch (error) {
                Alert.alert('Places', authErrorMessage(error));
              } finally {
                setBusyId(null);
              }
            })();
          },
        },
      ],
    );
  };

  const useMyLocation = () => {
    void (async () => {
      setLoading(true);
      try {
        const auto = await resolveAutoPlace(null);
        if (!auto?.label) {
          Alert.alert('Places', 'Could not detect your location.');
          return;
        }
        const place =
          auto.latitude && auto.longitude
            ? await ensureDetectedPlace({
                userId,
                label: auto.label,
                latitude: auto.latitude,
                longitude: auto.longitude,
              })
            : await createUserPlace({
                userId,
                name: auto.label,
                makeActive: true,
              });
        await reload();
        onActivePlace(place);
      } catch (error) {
        Alert.alert('Places', authErrorMessage(error));
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>My places</Text>
                <Text style={styles.subtitle}>
                  Save spots you care about — pick one and Muse dresses for that
                  weather.
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.iconBtn}>
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  tintColor={Colors.light.primary}
                  size={18}
                />
              </Pressable>
            </View>

            <Pressable style={styles.addBtn} onPress={openCreate}>
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                tintColor={Colors.light.primary}
                size={16}
              />
              <Text style={styles.addText}>Add place</Text>
            </Pressable>

            <Pressable style={styles.detectBtn} onPress={useMyLocation}>
              <SymbolView
                name={{
                  ios: 'location.fill',
                  android: 'my_location',
                  web: 'my_location',
                }}
                tintColor={Colors.light.onPrimary}
                size={16}
              />
              <Text style={styles.detectText}>Use my location now</Text>
            </Pressable>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {loading && places.length === 0 ? (
                <ActivityIndicator color={Colors.light.primary} />
              ) : null}
              {!loading && places.length === 0 ? (
                <Text style={styles.empty}>
                  No saved places yet. Add one or use your location.
                </Text>
              ) : null}
              {places.map((place) => (
                <View
                  key={place.id}
                  style={[styles.card, place.is_active && styles.cardActive]}>
                  <Pressable
                    style={styles.cardMain}
                    onPress={() => void activate(place)}
                    disabled={busyId === place.id}>
                    <Text style={styles.cardTitle}>{placeChipLabel(place)}</Text>
                    <Text style={styles.cardMeta}>
                      {[
                        place.latitude != null && place.longitude != null
                          ? `${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)}`
                          : null,
                        place.is_active ? 'Active' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    {place.notes ? (
                      <Text style={styles.cardNotes} numberOfLines={2}>
                        {place.notes}
                      </Text>
                    ) : null}
                  </Pressable>
                  <View style={styles.cardActions}>
                    <Pressable
                      style={styles.miniBtn}
                      onPress={() => openEdit(place)}>
                      <Text style={styles.miniText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={styles.miniBtn}
                      onPress={() => remove(place)}>
                      <Text style={[styles.miniText, styles.deleteText]}>
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PlaceEditorModal
        visible={editorOpen}
        place={editing}
        onClose={() => setEditorOpen(false)}
        onSave={(input) => void handleSave(input)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(18, 38, 63, 0.4)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: Colors.light.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: PageGutter,
    marginBottom: 10,
  },
  title: {
    fontFamily: Typeface.display,
    fontSize: 22,
    color: Colors.light.primary,
  },
  subtitle: {
    fontFamily: Typeface.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  addBtn: {
    marginHorizontal: PageGutter,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.backgroundElement,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addText: {
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.primary,
    fontSize: 14,
  },
  detectBtn: {
    marginHorizontal: PageGutter,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detectText: {
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.onPrimary,
    fontSize: 14,
  },
  list: { paddingHorizontal: PageGutter },
  listContent: { paddingBottom: 24, gap: 10 },
  empty: {
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    paddingVertical: 20,
  },
  card: {
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundElement,
    padding: 14,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  cardMain: { marginBottom: 10 },
  cardTitle: {
    fontFamily: Typeface.bodyStrong,
    fontSize: 16,
    color: Colors.light.primary,
  },
  cardMeta: {
    fontFamily: Typeface.body,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  cardNotes: {
    fontFamily: Typeface.body,
    fontSize: 13,
    color: Colors.light.primary,
    marginTop: 6,
  },
  cardActions: { flexDirection: 'row', gap: 8 },
  miniBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.canvas,
  },
  miniText: {
    fontFamily: Typeface.bodyStrong,
    fontSize: 12,
    color: Colors.light.primary,
  },
  deleteText: { color: '#8B3A3A' },
});
