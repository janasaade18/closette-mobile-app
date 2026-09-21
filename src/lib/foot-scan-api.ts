import * as FileSystem from 'expo-file-system/legacy';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type FootSide = 'left' | 'right';
export type CaptureView = 'top' | 'front' | 'left' | 'right' | 'heel';

export type CaptureGuide = {
  view: CaptureView;
  title: string;
  instruction: string;
  order: number;
  required: boolean;
};

export type OutlineFit = {
  colorNotReady: string;
  colorReady: string;
  requireFootVisible: boolean;
  minFootAreaRatio: number;
  maxFootAreaRatio: number;
  minSharpness: number;
  stableMs: number;
  autoCaptureOnReady: boolean;
  advanceToNextViewAfterCapture: boolean;
};

export const DEFAULT_OUTLINE_FIT: OutlineFit = {
  colorNotReady: '#E53935',
  colorReady: '#43A047',
  requireFootVisible: true,
  minFootAreaRatio: 0.28,
  maxFootAreaRatio: 0.78,
  minSharpness: 80,
  stableMs: 2000,
  autoCaptureOnReady: true,
  advanceToNextViewAfterCapture: true,
};

export type ScanProgress = {
  accepted: number;
  total: number;
  min: number;
  max: number;
  percent: number;
  coverage: { view: CaptureView; count: number; done: boolean }[];
  missingViews: CaptureView[];
};

export type ScanRecord = {
  scanId: string;
  footSide: FootSide;
  status: 'capturing' | 'processing' | 'ready' | 'failed';
  reconstruction: {
    status: string;
    glbUrl: string | null;
    objUrl: string | null;
    message?: string;
  };
  progress: ScanProgress;
  error: string | null;
};

export type GuidesResponse = {
  startWith: FootSide;
  minAcceptedFrames: number;
  maxAcceptedFrames: number;
  minFramesPerView: number;
  requiredViews: CaptureView[];
  outlineFit: OutlineFit;
  guides: CaptureGuide[];
};

type Envelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  const json = (await response.json()) as Envelope<T> & { message?: string };
  if (!response.ok || json.success === false) {
    throw new Error(json.message ?? `Request failed: ${response.status}`);
  }
  return json.data;
}

export function getGuides() {
  return request<GuidesResponse>('/scans/guides');
}

export function createScan(input: {
  footSide: FootSide;
  device?: { brand?: string; model?: string; os?: string };
}) {
  return request<ScanRecord>('/scans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getScan(id: string) {
  return request<ScanRecord>(`/scans/${id}`);
}

export function completeScan(id: string) {
  return request<ScanRecord>(`/scans/${id}/complete`, { method: 'POST' });
}

/** Multipart upload that works with Expo (avoids FormDataPart / relative URI errors). */
export async function uploadFrame(input: {
  scanId: string;
  uri: string;
  view: CaptureView;
  sharpness?: number;
  footVisible?: boolean;
  footAreaRatio?: number;
  accepted?: boolean;
}) {
  const fileUri = input.uri.startsWith('file://')
    ? input.uri
    : `file://${input.uri}`;

  const parameters: Record<string, string> = {
    view: input.view,
    capturedAt: new Date().toISOString(),
    accepted: String(input.accepted ?? true),
  };
  if (input.sharpness != null) {
    parameters.sharpness = String(input.sharpness);
  }
  if (input.footVisible != null) {
    parameters.footVisible = String(input.footVisible);
  }
  if (input.footAreaRatio != null) {
    parameters.footAreaRatio = String(input.footAreaRatio);
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await FileSystem.uploadAsync(
        `${API_URL}/scans/${input.scanId}/frames`,
        fileUri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType: 'image/jpeg',
          parameters,
        },
      );

      const json = JSON.parse(result.body) as Envelope<ScanRecord> & {
        message?: string;
      };
      if (result.status < 200 || result.status >= 300 || json.success === false) {
        throw new Error(json.message ?? `Request failed: ${result.status}`);
      }
      return json.data;
    } catch (err) {
      lastError = err;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Upload failed — check API connection');
}
