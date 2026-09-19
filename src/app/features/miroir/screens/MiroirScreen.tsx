import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import * as Device from 'expo-device';
import {
  CaptureGuide,
  CaptureView,
  FootSide,
  ScanRecord,
  completeScan,
  createScan,
  getGuides,
  uploadFrame,
} from '@/app/lib/foot-scan-api';

type Phase = 'intro' | 'scanning' | 'uploading' | 'done';

const VIEW_LABEL: Record<CaptureView, string> = {
  top: 'Top',
  front: 'Front',
  left: 'Left',
  right: 'Right',
  heel: 'Heel',
};

export default function MiroirScreen() {
  const cameraRef = useRef<Camera>(null);
  const capturingRef = useRef(false);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [phase, setPhase] = useState<Phase>('intro');
  const [footSide, setFootSide] = useState<FootSide>('left');
  const [guides, setGuides] = useState<CaptureGuide[]>([]);
  const [viewIndex, setViewIndex] = useState(0);
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission) {
      void requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    void getGuides()
      .then((data) => {
        setGuides(data.guides);
        setFootSide(data.startWith);
      })
      .catch(() => {
        setGuides([
          {
            view: 'top',
            title: 'Place your foot inside the outline',
            instruction: 'Look straight down and move slowly.',
            order: 1,
            required: true,
          },
          {
            view: 'front',
            title: 'Move to the front',
            instruction: 'Point the camera at the toes.',
            order: 2,
            required: true,
          },
          {
            view: 'left',
            title: 'Move to the left side',
            instruction: 'Orbit left. Keep the arch visible.',
            order: 3,
            required: true,
          },
          {
            view: 'right',
            title: 'Move to the right side',
            instruction: 'Orbit right. Keep the outer edge in view.',
            order: 4,
            required: true,
          },
          {
            view: 'heel',
            title: 'Capture the heel',
            instruction: 'Point the camera at the heel.',
            order: 5,
            required: true,
          },
        ]);
      });
  }, []);

  const currentGuide = guides[viewIndex];
  const coverage = scan?.progress.coverage ?? [];
  const percent = scan?.progress.percent ?? 0;

  const startScan = async () => {
    setError(null);
    try {
      const created = await createScan({
        footSide,
        device: {
          brand: Device.brand ?? undefined,
          model: Device.modelName ?? undefined,
          os: `${Device.osName ?? ''} ${Device.osVersion ?? ''}`.trim(),
        },
      });
      setScan(created);
      setViewIndex(0);
      setPhase('scanning');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start scan');
    }
  };

  const captureFrame = async () => {
    if (!scan || !currentGuide || capturingRef.current) {
      return;
    }
    if ((scan.progress.accepted ?? 0) >= (scan.progress.max ?? 60)) {
      return;
    }

    capturingRef.current = true;
    try {
      const photo = await cameraRef.current?.takePhoto();
      if (!photo?.path) {
        return;
      }
      const updated = await uploadFrame({
        scanId: scan.scanId,
        uri: photo.path,
        view: currentGuide.view,
      });
      setScan(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      capturingRef.current = false;
    }
  };

  const finishScan = async () => {
    if (!scan) {
      return;
    }
    setPhase('uploading');
    setError(null);
    try {
      const result = await completeScan(scan.scanId);
      setScan(result);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not finish scan');
      setPhase('scanning');
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.darkText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.darkText}>Loading camera...</Text>
      </View>
    );
  }

  if (phase === 'intro') {
    return (
      <View style={styles.center}>
        <Text style={styles.kicker}>FOOT SCANNING</Text>
        <Text style={styles.title}>
          Place your {footSide} foot inside the outline.
        </Text>
        <Text style={styles.body}>
          Remove your shoe and sock. Scan one foot at a time. Move the camera
          slowly around the foot — the phone only guides you. The server builds
          the 3D model.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={() => void startScan()}>
          <Text style={styles.buttonText}>Start {footSide} foot</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'uploading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#208AEF" />
        <Text style={styles.darkText}>Sending frames for 3D reconstruction…</Text>
      </View>
    );
  }

  if (phase === 'done' && scan) {
    return (
      <View style={styles.center}>
        <Text style={styles.kicker}>SCAN SAVED</Text>
        <Text style={styles.title}>{scan.progress.accepted} frames uploaded</Text>
        <Text style={styles.body}>
          Reconstruction: {scan.reconstruction.status}
          {scan.reconstruction.message ? `\n${scan.reconstruction.message}` : ''}
        </Text>
        {scan.reconstruction.glbUrl ? (
          <Text style={styles.body}>GLB: {scan.reconstruction.glbUrl}</Text>
        ) : null}
        <Pressable
          style={styles.button}
          onPress={() => {
            setFootSide(footSide === 'left' ? 'right' : 'left');
            setScan(null);
            setPhase('intro');
          }}>
          <Text style={styles.buttonText}>
            Now scan your {footSide === 'left' ? 'right' : 'left'} foot
          </Text>
        </Pressable>
      </View>
    );
  }

  const canFinish =
    (scan?.progress.accepted ?? 0) >= (scan?.progress.min ?? 30) &&
    (scan?.progress.missingViews.length ?? 1) === 0;

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={phase === 'scanning'}
        photo
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayKicker}>FOOT SCANNING</Text>
        <View style={styles.outline} />
        <Text style={styles.instruction}>{currentGuide?.title}</Text>
        <Text style={styles.hint}>{currentGuide?.instruction}</Text>
        <Text style={styles.hint}>Move slowly →</Text>

        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.percent}>{percent}%</Text>

        <View style={styles.checklist}>
          {(['top', 'front', 'left', 'right', 'heel'] as CaptureView[]).map(
            (view) => {
              const item = coverage.find((entry) => entry.view === view);
              const done = item?.done ?? false;
              const current = currentGuide?.view === view;
              return (
                <Text
                  key={view}
                  style={[
                    styles.checkItem,
                    done && styles.checkDone,
                    current && styles.checkCurrent,
                  ]}>
                  {done ? '✓' : '○'} {VIEW_LABEL[view]}
                  {item ? `  ${item.count}` : ''}
                </Text>
              );
            },
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={() => void captureFrame()}>
            <Text style={styles.buttonText}>Capture frame</Text>
          </Pressable>
          {viewIndex < guides.length - 1 ? (
            <Pressable
              style={styles.secondary}
              onPress={() => setViewIndex((index) => index + 1)}>
              <Text style={styles.secondaryText}>Next view</Text>
            </Pressable>
          ) : null}
          {canFinish ? (
            <Pressable style={styles.button} onPress={() => void finishScan()}>
              <Text style={styles.buttonText}>Finish scan</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0b1220',
  },
  overlay: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    paddingBottom: 28,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  outline: {
    alignSelf: 'center',
    width: 180,
    height: 280,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    marginBottom: 24,
  },
  kicker: {
    color: '#8ec5ff',
    letterSpacing: 2,
    fontSize: 13,
    marginBottom: 12,
  },
  overlayKicker: {
    color: 'white',
    letterSpacing: 2,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    color: '#d5deea',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  darkText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 12,
  },
  instruction: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    color: '#d5deea',
    textAlign: 'center',
    marginTop: 6,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    marginTop: 16,
  },
  barFill: {
    height: 8,
    backgroundColor: '#4da3ff',
  },
  percent: {
    color: 'white',
    textAlign: 'center',
    marginTop: 6,
  },
  checklist: {
    marginTop: 16,
    gap: 4,
  },
  checkItem: {
    color: '#b8c4d4',
    fontSize: 16,
  },
  checkDone: {
    color: '#7dffb0',
  },
  checkCurrent: {
    color: 'white',
    fontWeight: '700',
  },
  actions: {
    marginTop: 16,
    gap: 10,
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  secondary: {
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: 'white',
    fontSize: 16,
  },
  error: {
    color: '#ff8a8a',
    marginTop: 10,
    textAlign: 'center',
  },
});