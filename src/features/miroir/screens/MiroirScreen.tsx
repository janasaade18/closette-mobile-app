import { useCallback, useEffect, useRef, useState } from 'react';
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
  usePhotoOutput,
  type CameraRef,
} from 'react-native-vision-camera';
import * as Device from 'expo-device';
import {
  CaptureGuide,
  CaptureView,
  DEFAULT_OUTLINE_FIT,
  FootSide,
  OutlineFit,
  ScanRecord,
  completeScan,
  createScan,
  getGuides,
  uploadFrame,
} from '@/lib/foot-scan-api';
import { FootOutlineCadre } from '../components/FootOutlineCadre';
import { useOutlineFit } from '../hooks/useOutlineFit';
import { cropFootForUpload } from '../lib/cropFootForUpload';

type Phase = 'intro' | 'scanning' | 'uploading' | 'done';

const VIEW_LABEL: Record<CaptureView, string> = {
  top: 'Top',
  front: 'Front',
  left: 'Left',
  right: 'Right',
  heel: 'Heel',
};

const FALLBACK_GUIDES: CaptureGuide[] = [
  {
    view: 'top',
    title: 'Top view',
    instruction: 'Look straight down. Fill the hole with your foot only.',
    order: 1,
    required: true,
  },
  {
    view: 'front',
    title: 'Toes',
    instruction: 'Point at the toes. Keep the foot filling the hole.',
    order: 2,
    required: true,
  },
  {
    view: 'left',
    title: 'Left side',
    instruction: 'Orbit left. Arch in the hole — no full leg.',
    order: 3,
    required: true,
  },
  {
    view: 'right',
    title: 'Right side',
    instruction: 'Orbit right. Outer edge filling the hole.',
    order: 4,
    required: true,
  },
  {
    view: 'heel',
    title: 'Heel',
    instruction: 'Center the heel in the hole and hold.',
    order: 5,
    required: true,
  },
];

export default function MiroirScreen() {
  const cameraRef = useRef<CameraRef>(null);
  const capturingRef = useRef(false);
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput();
  const { hasPermission, requestPermission } = useCameraPermission();

  const [phase, setPhase] = useState<Phase>('intro');
  const [footSide, setFootSide] = useState<FootSide>('left');
  const [guides, setGuides] = useState<CaptureGuide[]>([]);
  const [outlineFit, setOutlineFit] = useState<OutlineFit>(DEFAULT_OUTLINE_FIT);
  const [viewIndex, setViewIndex] = useState(0);
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusHint, setStatusHint] = useState('Place your foot in the outline');
  const [isBusy, setIsBusy] = useState(false);

  const fit = useOutlineFit({
    enabled: phase === 'scanning',
    outlineFit,
    photoOutput,
    isBusy,
  });

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
        if (data.outlineFit) {
          setOutlineFit({
            ...DEFAULT_OUTLINE_FIT,
            ...data.outlineFit,
            stableMs: 2000,
          });
        }
      })
      .catch(() => {
        setGuides(FALLBACK_GUIDES);
      });
  }, []);

  const currentGuide = guides[viewIndex];
  const step = viewIndex + 1;
  const totalSteps = Math.max(guides.length, 1);
  const canFinish =
    (scan?.progress.accepted ?? 0) >= (scan?.progress.min ?? 5) &&
    (scan?.progress.missingViews.length ?? 1) === 0;

  const advanceAfterCapture = useCallback(
    (_updated: ScanRecord, _capturedView: CaptureView) => {
      if (!outlineFit.advanceToNextViewAfterCapture) {
        return;
      }
      if (viewIndex < guides.length - 1) {
        setViewIndex((index) => index + 1);
        setStatusHint('Next angle — foot in the hole');
        return;
      }
      setStatusHint('Done — tap Finish');
    },
    [guides.length, outlineFit.advanceToNextViewAfterCapture, viewIndex],
  );

  const markCaptured = fit.markCaptured;
  const estimate = fit.estimate;

  const captureFrame = useCallback(async () => {
    if (!scan || !currentGuide || capturingRef.current) {
      return;
    }
    if ((scan.progress.accepted ?? 0) >= (scan.progress.max ?? 60)) {
      return;
    }

    capturingRef.current = true;
    setIsBusy(true);
    setStatusHint('Capturing…');
    try {
      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      );
      let photoPath: string | null = null;
      try {
        photoPath = await cropFootForUpload(photo);
      } finally {
        photo.dispose();
      }
      if (!photoPath) {
        setStatusHint('Could not take photo — try again');
        return;
      }
      if (!estimate.footVisible) {
        setStatusHint('Not a clear foot — try again');
        markCaptured();
        return;
      }
      const updated = await uploadFrame({
        scanId: scan.scanId,
        uri: photoPath,
        view: currentGuide.view,
        accepted: true,
        footVisible: estimate.footVisible,
        footAreaRatio: estimate.footAreaRatio,
        sharpness: estimate.sharpness,
      });
      setScan(updated);
      markCaptured();
      advanceAfterCapture(updated, currentGuide.view);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStatusHint('Upload failed — align again');
      markCaptured();
    } finally {
      capturingRef.current = false;
      setIsBusy(false);
    }
  }, [advanceAfterCapture, currentGuide, estimate, markCaptured, photoOutput, scan]);

  const autoFiredRef = useRef(false);

  useEffect(() => {
    if (phase !== 'scanning' || !outlineFit.autoCaptureOnReady) {
      return;
    }
    if (!fit.isReady || !fit.estimate.footVisible) {
      autoFiredRef.current = false;
      return;
    }
    if (autoFiredRef.current || capturingRef.current) {
      return;
    }
    autoFiredRef.current = true;
    void captureFrame();
  }, [
    captureFrame,
    fit.estimate.footVisible,
    fit.isReady,
    outlineFit.autoCaptureOnReady,
    phase,
  ]);

  useEffect(() => {
    if (phase === 'scanning') {
      setStatusHint(fit.hint);
    }
  }, [fit.hint, phase]);

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
      setStatusHint('Place your foot in the outline');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start scan');
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

  if (!hasPermission || device == null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#E8C9A0" />
        <Text style={styles.muted}>
          {!hasPermission ? 'Waiting for camera…' : 'Starting camera…'}
        </Text>
      </View>
    );
  }

  if (phase === 'intro') {
    return (
      <View style={styles.center}>
        <Text style={styles.brand}>Closette</Text>
        <Text style={styles.kicker}>MIROIR · FOOT SCAN</Text>
        <Text style={styles.title}>Scan your {footSide} foot</Text>
        <Text style={styles.body}>
          Put your foot in the hole. Hold still 2 seconds when it’s there —
          we capture that hole only (for sizing & 3D).
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.primaryBtn} onPress={() => void startScan()}>
          <Text style={styles.primaryBtnText}>Start {footSide} foot</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'uploading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#E8C9A0" />
        <Text style={styles.muted}>Building your 3D foot…</Text>
      </View>
    );
  }

  if (phase === 'done' && scan) {
    const other: FootSide = footSide === 'left' ? 'right' : 'left';
    return (
      <View style={styles.center}>
        <Text style={styles.kicker}>SAVED</Text>
        <Text style={styles.title}>{scan.progress.accepted} foot frames</Text>
        <Text style={styles.body}>
          {scan.reconstruction.status}
          {scan.reconstruction.message ? `\n${scan.reconstruction.message}` : ''}
        </Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            setFootSide(other);
            setScan(null);
            setPhase('intro');
          }}>
          <Text style={styles.primaryBtnText}>Scan {other} foot</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={[photoOutput]}
        isActive={phase === 'scanning'}
        resizeMode="cover"
      />

      <FootOutlineCadre
        status={fit.status}
        progress={fit.progress}
        colorNotReady={outlineFit.colorNotReady}
        colorReady={outlineFit.colorReady}
      />

      <View style={styles.chrome}>
        <View style={styles.topBar}>
          <Text style={styles.stepLabel}>
            {VIEW_LABEL[currentGuide?.view ?? 'top']}
          </Text>
          <View style={styles.dots}>
            {guides.map((guide, index) => {
              const done =
                scan?.progress.coverage.find((c) => c.view === guide.view)
                  ?.done ?? index < viewIndex;
              const current = index === viewIndex;
              return (
                <View
                  key={guide.view}
                  style={[
                    styles.dot,
                    done && styles.dotDone,
                    current && styles.dotCurrent,
                  ]}
                />
              );
            })}
          </View>
          <Text style={styles.stepCount}>
            {step}/{totalSteps}
          </Text>
        </View>

        <View style={styles.bottomPanel}>
          <Text style={styles.guideTitle}>{currentGuide?.title}</Text>
          <Text
            style={[
              styles.statusLine,
              fit.isReady ? styles.statusReady : styles.statusWait,
            ]}>
            {statusHint}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.bottomActions}>
            {viewIndex < guides.length - 1 ? (
              <Pressable
                style={styles.ghostBtn}
                onPress={() => {
                  setViewIndex((index) => index + 1);
                  fit.markCaptured();
                  setStatusHint('Place your foot in the outline');
                }}>
                <Text style={styles.ghostBtnText}>Skip</Text>
              </Pressable>
            ) : (
              <View style={styles.ghostBtnPlaceholder} />
            )}
            {canFinish ? (
              <Pressable
                style={styles.primaryBtnCompact}
                onPress={() => void finishScan()}>
                <Text style={styles.primaryBtnText}>Finish</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070A',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#0B0F14',
  },
  brand: {
    color: '#F3E6D4',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  kicker: {
    color: '#C4A574',
    letterSpacing: 2.4,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 14,
  },
  title: {
    color: '#F7F3EC',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  body: {
    color: '#A8B0BC',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: 340,
  },
  muted: {
    color: '#A8B0BC',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 14,
  },
  chrome: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepLabel: {
    color: '#F7F3EC',
    fontSize: 15,
    fontWeight: '700',
    width: 72,
  },
  stepCount: {
    color: '#A8B0BC',
    fontSize: 13,
    fontWeight: '600',
    width: 72,
    textAlign: 'right',
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  dotDone: {
    backgroundColor: '#6FCF97',
  },
  dotCurrent: {
    width: 18,
    backgroundColor: '#E8C9A0',
  },
  bottomPanel: {
    gap: 8,
  },
  guideTitle: {
    color: '#F7F3EC',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusLine: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    minHeight: 22,
  },
  statusWait: {
    color: '#F07167',
  },
  statusReady: {
    color: '#6FCF97',
  },
  bottomActions: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#E8C9A0',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnCompact: {
    flex: 1,
    backgroundColor: '#E8C9A0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#1A140E',
    fontWeight: '700',
    fontSize: 16,
  },
  ghostBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  ghostBtnPlaceholder: {
    width: 64,
  },
  ghostBtnText: {
    color: 'rgba(247,243,236,0.75)',
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: '#FF8E8E',
    textAlign: 'center',
    marginTop: 4,
  },
});
