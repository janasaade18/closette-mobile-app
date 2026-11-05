import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const USE_NEST = process.env.EXPO_PUBLIC_GARMENT_VIA_NEST === '1';

/**
 * Same machine the phone already used to load Metro. That IP updates
 * automatically whenever you open Expo Go on a new Wi‑Fi — no .env edits.
 */
function resolveDevHost(): string {
  const explicit = process.env.EXPO_PUBLIC_DEV_HOST?.trim();
  if (explicit) {
    return explicit.replace(/^https?:\/\//, '').split(':')[0];
  }

  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    // Legacy manifest (Expo Go)
    (Constants as { manifest?: { debuggerHost?: string } }).manifest
      ?.debuggerHost,
    Constants.linkingUri,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = String(candidate).match(/(\d{1,3}(?:\.\d{1,3}){3})/);
    if (match?.[1]) {
      return match[1];
    }
  }

  // Android emulator → host loopback. Physical USB + adb reverse → 127.0.0.1.
  return '127.0.0.1';
}

function nestBaseUrl() {
  const override = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (override) {
    return override.replace(/\/$/, '');
  }
  return `http://${resolveDevHost()}:3000`;
}

function mlBaseUrl() {
  const override = process.env.EXPO_PUBLIC_GARMENT_API_URL?.trim();
  if (override) {
    return override.replace(/\/$/, '');
  }
  return `http://${resolveDevHost()}:8090`;
}

export type GarmentClassifyStatus =
  | 'success'
  | 'review'
  | 'unclear'
  | 'error';

export type GarmentAlternative = {
  category: string;
  subcategory: string;
  confidence: number;
};

export type GarmentClassifyResult = {
  status: GarmentClassifyStatus;
  category: string | null;
  subcategory: string | null;
  confidence: number | null;
  bbox: number[] | null;
  reason: string | null;
  alternatives: GarmentAlternative[] | null;
  latency_ms?: number;
  model_version: string;
  models?: {
    classifier?: string;
    classifier_id?: string;
    segmenter?: string | null;
    taxonomy_version?: number;
  };
  error?: string;
  message?: string;
};

export type GarmentCorrectionInput = {
  image_id: string;
  predicted_category: string | null;
  predicted_subcategory: string | null;
  corrected_category: string;
  corrected_subcategory: string;
  confidence: number | null;
  model_version: string;
};

export type GarmentColorSwatch = {
  name: string;
  hex: string;
  proportion: number;
};

export type GarmentAppearanceGarment = {
  group: string | null;
  type: string | null;
  confidence: number | null;
  box: number[] | null;
  color: {
    primary: GarmentColorSwatch;
    secondary?: GarmentColorSwatch[];
    is_multicolor?: boolean;
  } | null;
  pattern: { primary: string; confidence: number };
  texture: { primary: string; confidence: number };
};

export type GarmentAppearanceResult = {
  status: 'success' | 'failed';
  garments: GarmentAppearanceGarment[];
  model_version: string;
  error?: string;
  message?: string;
};

function classifyUrl(includeMask: boolean) {
  if (USE_NEST) {
    const query = includeMask ? '' : '?include_mask=false';
    return `${nestBaseUrl()}/garments/classify${query}`;
  }
  const query = includeMask ? 'include_mask=true' : 'include_mask=false';
  return `${mlBaseUrl()}/v1/garments/classify?${query}`;
}

function correctionsUrl() {
  return USE_NEST
    ? `${nestBaseUrl()}/garments/corrections`
    : `${mlBaseUrl()}/v1/garments/corrections`;
}

function guessName(uri: string) {
  const clean = uri.split('?')[0] ?? uri;
  const leaf = clean.split('/').pop() ?? 'photo.jpg';
  if (/\.(jpe?g|png|webp)$/i.test(leaf)) {
    return leaf;
  }
  return 'photo.jpg';
}

function mimeForName(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

type NestEnvelope = {
  success?: boolean;
  data?: GarmentClassifyResult;
  message?: string;
  error?: string;
};

function unwrapClassifyPayload(json: unknown): GarmentClassifyResult {
  if (
    json &&
    typeof json === 'object' &&
    'data' in json &&
    (json as NestEnvelope).data &&
    typeof (json as NestEnvelope).data === 'object' &&
    'status' in ((json as NestEnvelope).data as object)
  ) {
    return (json as NestEnvelope).data as GarmentClassifyResult;
  }
  return json as GarmentClassifyResult;
}

async function parseBody(response: Response): Promise<GarmentClassifyResult> {
  const json = (await response.json()) as GarmentClassifyResult & NestEnvelope;
  if (!response.ok) {
    throw new Error(json.message ?? json.error ?? `Request failed: ${response.status}`);
  }
  return unwrapClassifyPayload(json);
}

function networkHint(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/unsupported FormDataPart/i.test(message)) {
    return 'Photo upload failed on this device build. Reload the app and try again.';
  }
  if (
    /Network request failed|Failed to fetch|timed out|ECONNREFUSED|Could not connect/i.test(
      message,
    )
  ) {
    return `Cannot reach the classifier at ${mlBaseUrl()}. On campus Wi‑Fi, phones often cannot talk to laptops — use a phone hotspot, or USB with adb reverse to 127.0.0.1.`;
  }
  return message;
}

async function classifyWithFetch(uri: string, includeMask: boolean) {
  const name = guessName(uri);
  const form = new FormData();
  const field = USE_NEST ? 'file' : 'image';
  // Always append a real Blob. RN FormData { uri, name, type } throws
  // "unsupported FormDataPart" on current Expo Go builds.
  const blob = await (await fetch(uri)).blob();
  form.append(field, blob, name);

  const response = await fetch(classifyUrl(includeMask), {
    method: 'POST',
    body: form,
  });
  return parseBody(response);
}

async function classifyWithUploadAsync(uri: string, includeMask: boolean) {
  const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
  const result = await FileSystem.uploadAsync(classifyUrl(includeMask), fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: USE_NEST ? 'file' : 'image',
    mimeType: mimeForName(guessName(uri)),
  });
  const json = JSON.parse(result.body) as GarmentClassifyResult & NestEnvelope;
  if (result.status < 200 || result.status >= 300) {
    throw new Error(json.message ?? json.error ?? `Request failed: ${result.status}`);
  }
  return unwrapClassifyPayload(json);
}

export async function classifyGarment(
  uri: string,
  options?: { includeMask?: boolean },
): Promise<GarmentClassifyResult> {
  const includeMask = options?.includeMask ?? false;
  if (Platform.OS === 'web') {
    return classifyWithFetch(uri, includeMask);
  }
  try {
    return await classifyWithUploadAsync(uri, includeMask);
  } catch (uploadError) {
    try {
      return await classifyWithFetch(uri, includeMask);
    } catch (fetchError) {
      throw new Error(networkHint(uploadError ?? fetchError));
    }
  }
}

export async function submitGarmentCorrection(
  body: GarmentCorrectionInput,
): Promise<{ ok: boolean }> {
  const response = await fetch(correctionsUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as {
    ok?: boolean;
    success?: boolean;
    data?: { ok?: boolean };
    message?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(json.message ?? json.error ?? `Correction failed: ${response.status}`);
  }
  return { ok: Boolean(json.ok ?? json.success ?? json.data ?? true) };
}

function appearanceUrl() {
  return `${nestBaseUrl()}/garments/appearance`;
}

function unwrapAppearancePayload(json: unknown): GarmentAppearanceResult {
  if (
    json &&
    typeof json === 'object' &&
    'data' in json &&
    (json as { data?: GarmentAppearanceResult }).data &&
    typeof (json as { data: GarmentAppearanceResult }).data === 'object' &&
    'status' in (json as { data: GarmentAppearanceResult }).data
  ) {
    return (json as { data: GarmentAppearanceResult }).data;
  }
  return json as GarmentAppearanceResult;
}

function classificationPayload(
  classification?: {
    type: string | null;
    group?: string | null;
    confidence: number | null;
    box: number[] | null;
  },
) {
  if (!classification?.box || !classification.type) {
    return null;
  }
  return JSON.stringify({
    type: classification.type,
    group: classification.group ?? null,
    confidence: classification.confidence,
    box: classification.box,
  });
}

async function appearanceWithUploadAsync(
  uri: string,
  classificationJson: string | null,
) {
  const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
  const result = await FileSystem.uploadAsync(appearanceUrl(), fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: mimeForName(guessName(uri)),
    parameters: classificationJson
      ? { classification: classificationJson }
      : undefined,
  });
  const json = JSON.parse(result.body) as GarmentAppearanceResult & {
    message?: string;
    error?: string;
  };
  if (result.status < 200 || result.status >= 300) {
    throw new Error(
      json.message ?? json.error ?? `Appearance failed: ${result.status}`,
    );
  }
  return unwrapAppearancePayload(json);
}

async function appearanceWithFetch(
  uri: string,
  classificationJson: string | null,
) {
  const name = guessName(uri);
  const form = new FormData();
  const blob = await (await fetch(uri)).blob();
  form.append('file', blob, name);
  if (classificationJson) {
    form.append('classification', classificationJson);
  }
  const response = await fetch(appearanceUrl(), {
    method: 'POST',
    body: form,
  });
  const json = await response.json();
  if (!response.ok) {
    const failed = json as { message?: string; error?: string };
    throw new Error(
      failed.message ?? failed.error ?? `Appearance failed: ${response.status}`,
    );
  }
  return unwrapAppearancePayload(json);
}

export async function analyzeGarmentAppearance(
  uri: string,
  classification?: {
    type: string | null;
    group?: string | null;
    confidence: number | null;
    box: number[] | null;
  },
): Promise<GarmentAppearanceResult> {
  const classificationJson = classificationPayload(classification);
  if (Platform.OS === 'web') {
    return appearanceWithFetch(uri, classificationJson);
  }
  try {
    return await appearanceWithUploadAsync(uri, classificationJson);
  } catch {
    // Fallback: read the file as a Blob (avoids RN FormData { uri, name, type }).
    return appearanceWithFetch(uri, classificationJson);
  }
}

export function displayName(id: string | null | undefined) {
  if (!id) return 'Unknown';
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function statusCopy(result: GarmentClassifyResult) {
  if (result.status === 'success') {
    return 'Closette is confident about this piece.';
  }
  if (result.status === 'review') {
    if (result.reason === 'ambiguous_pair') {
      return 'Two close labels. Confirm the right one.';
    }
    if (result.reason === 'localization_disagrees') {
      return 'The crop and the label disagree. Please confirm.';
    }
    if (result.reason === 'low_confidence') {
      return 'Low confidence. Please confirm or correct.';
    }
    return 'Please confirm this guess.';
  }
  if (result.status === 'unclear') {
    return 'No clear garment was found in this photo.';
  }
  return result.message ?? 'Something went wrong.';
}
