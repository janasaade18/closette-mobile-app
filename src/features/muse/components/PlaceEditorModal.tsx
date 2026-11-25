import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import type { UserPlace } from '@/features/muse/services/userPlaces';

export type PlaceEditorSave = {
  name: string;
  notes: string;
  latitude: number;
  longitude: number;
};

type Props = {
  visible: boolean;
  place?: UserPlace | null;
  onClose: () => void;
  onSave: (input: PlaceEditorSave) => void;
};

const DEFAULT_DELTA = 0.02;

async function detectMapCenter(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    let status = current.status;
    if (status !== Location.PermissionStatus.GRANTED) {
      const asked = await Location.requestForegroundPermissionsAsync();
      status = asked.status;
    }
    if (status === Location.PermissionStatus.GRANTED) {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    }
  } catch {
    // fall through to IP
  }

  try {
    const res = await fetch('https://ipwho.is/');
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success?: boolean;
      latitude?: number;
      longitude?: number;
    };
    if (
      json.success === false ||
      typeof json.latitude !== 'number' ||
      typeof json.longitude !== 'number'
    ) {
      return null;
    }
    return { latitude: json.latitude, longitude: json.longitude };
  } catch {
    return null;
  }
}

export function PlaceEditorModal({
  visible,
  place = null,
  onClose,
  onSave,
}: Props) {
  const editing = Boolean(place);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    if (place) {
      setName(place.nickname || place.label || place.query_name || '');
      setNotes(place.notes ?? '');
      if (
        place.latitude != null &&
        place.longitude != null &&
        !(place.latitude === 0 && place.longitude === 0)
      ) {
        setPin({ latitude: place.latitude, longitude: place.longitude });
        return;
      }
    } else {
      setName('');
      setNotes('');
      setPin(null);
    }

    setLocating(true);
    void detectMapCenter().then((center) => {
      if (cancelled) return;
      setPin(center);
      setLocating(false);
    });

    return () => {
      cancelled = true;
    };
  }, [visible, place]);

  const [mapKey, setMapKey] = useState(0);

  const centerOnMe = () => {
    setLocating(true);
    void detectMapCenter().then((center) => {
      if (center) {
        setPin(center);
        setMapKey((value) => value + 1);
      }
      setLocating(false);
    });
  };

  const canSave = Boolean(name.trim() && pin);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{editing ? 'Edit place' : 'Add a place'}</Text>
            <Text style={styles.subtitle}>
              Name it whatever you want, then drop the pin on the map.
            </Text>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Mum’s, Ski cabin, Office"
              placeholderTextColor={Colors.light.textSecondary}
              autoFocus={!editing}
              style={styles.input}
            />

            <View style={styles.mapHeader}>
              <Text style={styles.fieldLabel}>Pin on map</Text>
              <Pressable onPress={centerOnMe} style={styles.locateBtn}>
                <Text style={styles.locateText}>Use my location</Text>
              </Pressable>
            </View>

            <View style={styles.mapWrap}>
              {locating && !pin ? (
                <View style={styles.mapLoading}>
                  <ActivityIndicator color={Colors.light.primary} />
                  <Text style={styles.mapHint}>Finding your area…</Text>
                </View>
              ) : pin && Platform.OS !== 'web' ? (
                <MapView
                  key={mapKey}
                  style={styles.map}
                  initialRegion={{
                    latitude: pin.latitude,
                    longitude: pin.longitude,
                    latitudeDelta: DEFAULT_DELTA,
                    longitudeDelta: DEFAULT_DELTA,
                  }}
                  onPress={(event) => {
                    const { latitude, longitude } = event.nativeEvent.coordinate;
                    setPin({ latitude, longitude });
                  }}>
                  <Marker
                    coordinate={pin}
                    draggable
                    onDragEnd={(event) => {
                      const { latitude, longitude } = event.nativeEvent.coordinate;
                      setPin({ latitude, longitude });
                    }}
                  />
                </MapView>
              ) : pin ? (
                <View style={styles.mapLoading}>
                  <Text style={styles.mapHint}>
                    Pin: {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
                  </Text>
                  <Text style={styles.mapHint}>
                    Drag isn’t available on web — use “Use my location”.
                  </Text>
                </View>
              ) : (
                <View style={styles.mapLoading}>
                  <Text style={styles.mapHint}>
                    Couldn’t find a map center. Try “Use my location”.
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.mapCaption}>
              Tap the map or drag the pin to set the spot.
            </Text>

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Cold at night, outdoor wedding…"
              placeholderTextColor={Colors.light.textSecondary}
              style={[styles.input, styles.notes]}
              multiline
            />

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={styles.secondary}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!pin || !name.trim()) return;
                  onSave({
                    name: name.trim(),
                    notes: notes.trim(),
                    latitude: pin.latitude,
                    longitude: pin.longitude,
                  });
                }}
                style={[styles.primary, !canSave && styles.disabled]}>
                <Text style={styles.primaryText}>
                  {editing ? 'Save changes' : 'Save & use'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(18, 38, 63, 0.4)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: Colors.light.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: PageGutter,
    paddingTop: 20,
    paddingBottom: 28,
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
    marginTop: 6,
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: Typeface.bodyStrong,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  locateBtn: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  locateText: {
    fontFamily: Typeface.bodyStrong,
    fontSize: 12,
    color: Colors.light.primary,
  },
  mapWrap: {
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.light.backgroundElement,
    marginBottom: 6,
  },
  map: { flex: 1 },
  mapLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  mapHint: {
    fontFamily: Typeface.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  mapCaption: {
    fontFamily: Typeface.body,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 10,
  },
  input: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: Colors.light.outlineBlue,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: Typeface.body,
    fontSize: 15,
    color: Colors.light.primary,
    backgroundColor: Colors.light.backgroundElement,
    marginBottom: 10,
  },
  notes: { minHeight: 72, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  secondary: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  secondaryText: {
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.primary,
  },
  primary: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
  },
  primaryText: {
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.onPrimary,
  },
  disabled: { opacity: 0.45 },
});
