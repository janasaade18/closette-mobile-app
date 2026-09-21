import { useCallback, useEffect, useRef, useState } from 'react';
import type { CameraPhotoOutput } from 'react-native-vision-camera';
import type { OutlineFit } from '@/lib/foot-scan-api';
import { evaluateFootInOutline, type FitProbeResult } from '../lib/analyzeFootFit';

export type FitStatus = 'aligning' | 'ready';

type Options = {
  enabled: boolean;
  outlineFit: OutlineFit;
  photoOutput: CameraPhotoOutput;
  isBusy: boolean;
  cooldownMs?: number;
};

/**
 * ONLY rule: foot in the hole + hold still 2 seconds → ready to capture.
 */
export function useOutlineFit({
  enabled,
  outlineFit,
  photoOutput,
  isBusy,
  cooldownMs = 1000,
}: Options) {
  const [status, setStatus] = useState<FitStatus>('aligning');
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState('Place your foot in the outline');
  const [lastProbe, setLastProbe] = useState<FitProbeResult | null>(null);

  const holdMs = 2000;
  const stableSinceRef = useRef<number | null>(null);
  const cooldownUntilRef = useRef(0);
  const prevGridRef = useRef<Float32Array | null>(null);
  const probingRef = useRef(false);

  const markCaptured = useCallback(() => {
    cooldownUntilRef.current = Date.now() + cooldownMs;
    stableSinceRef.current = null;
    prevGridRef.current = null;
    setStatus('aligning');
    setProgress(0);
    setHint('Place your foot in the outline');
  }, [cooldownMs]);

  useEffect(() => {
    if (!enabled) {
      setStatus('aligning');
      setProgress(0);
      setHint('Place your foot in the outline');
      stableSinceRef.current = null;
      prevGridRef.current = null;
      return;
    }

    let cancelled = false;

    const probe = async () => {
      if (cancelled || probingRef.current || isBusy) {
        return;
      }
      const now = Date.now();
      if (now < cooldownUntilRef.current) {
        setStatus('aligning');
        setProgress(0);
        setHint('Next — place foot in the outline');
        return;
      }

      probingRef.current = true;
      try {
        const photo = await photoOutput.capturePhoto(
          { flashMode: 'off', enableShutterSound: false },
          {},
        );
        try {
          const image = await photo.toImageAsync();
          try {
            const small = await image.resizeAsync(
              Math.max(48, Math.floor(image.width / 16)),
              Math.max(64, Math.floor(image.height / 16)),
            );
            try {
              const raw = await small.toRawPixelDataAsync(false);
              const result = evaluateFootInOutline(
                raw.buffer,
                raw.width,
                raw.height,
                raw.pixelFormat,
                prevGridRef.current,
              );
              prevGridRef.current = result.grid;
              setLastProbe(result);

              if (!result.inFrame) {
                stableSinceRef.current = null;
                setProgress(0);
                setStatus('aligning');
                setHint('Put your foot in the outline');
                return;
              }

              if (!result.still) {
                stableSinceRef.current = null;
                setProgress(0);
                setStatus('aligning');
                setHint('Foot OK — hold still 2 seconds');
                return;
              }

              if (stableSinceRef.current == null) {
                stableSinceRef.current = now;
              }
              const held = Date.now() - stableSinceRef.current;
              const ratio = Math.min(1, held / holdMs);
              setProgress(ratio);

              if (held >= holdMs) {
                setStatus('ready');
                setHint('Capturing…');
              } else {
                setStatus('aligning');
                setHint(`Hold still… ${Math.ceil((holdMs - held) / 1000)}s`);
              }
            } finally {
              small.dispose();
            }
          } finally {
            image.dispose();
          }
        } finally {
          photo.dispose();
        }
      } catch {
        setHint('Put your foot in the outline');
      } finally {
        probingRef.current = false;
      }
    };

    void probe();
    const id = setInterval(() => {
      void probe();
    }, 400);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, holdMs, isBusy, outlineFit, photoOutput]);

  return {
    status,
    progress,
    isReady: status === 'ready',
    holdMs,
    hint,
    markCaptured,
    estimate: {
      footVisible: lastProbe?.inFrame ?? false,
      footAreaRatio: lastProbe?.footAreaRatio ?? 0.05,
      sharpness: lastProbe?.sharpness ?? 40,
    },
  };
}
