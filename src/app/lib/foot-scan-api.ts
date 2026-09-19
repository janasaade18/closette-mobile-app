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
  return request<{
    startWith: FootSide;
    minAcceptedFrames: number;
    maxAcceptedFrames: number;
    minFramesPerView: number;
    requiredViews: CaptureView[];
    guides: CaptureGuide[];
  }>('/scans/guides');
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

export function uploadFrame(input: {
  scanId: string;
  uri: string;
  view: CaptureView;
}) {
  const form = new FormData();
  const uri = input.uri.startsWith('file://') ? input.uri : `file://${input.uri}`;
  form.append('file', {
    uri,
    name: `${input.view}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);
  form.append('view', input.view);
  form.append('capturedAt', new Date().toISOString());
  form.append('accepted', 'true');

  return request<ScanRecord>(`/scans/${input.scanId}/frames`, {
    method: 'POST',
    body: form,
  });
}