/**
 * Simple foot-in-hole check: skin/sock in the cadre + stillness.
 * No aggressive leg rules — just "is there a foot here".
 */

import { cadreNormRect } from './cadreGeometry';

export type FitProbeResult = {
  inFrame: boolean;
  still: boolean;
  confidence: number;
  footAreaRatio: number;
  sharpness: number;
  legSpill: boolean;
};

type SampleGrid = Float32Array;

const GRID_W = 10;
const GRID_H = 14;

function luminance(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function isFootLikeTone(r: number, g: number, b: number) {
  const skin =
    r > 70 &&
    g > 35 &&
    b > 20 &&
    r >= g &&
    r - b > 12 &&
    r < 250 &&
    !(g > r + 20);
  const sock =
    Math.abs(r - g) < 30 &&
    Math.abs(g - b) < 30 &&
    r > 85 &&
    r < 235;
  return skin || sock;
}

function readRgb(
  data: Uint8Array,
  index: number,
  format: string,
): [number, number, number] {
  switch (format) {
    case 'BGRA':
    case 'BGRX':
      return [data[index + 2]!, data[index + 1]!, data[index]!];
    case 'ABGR':
    case 'XBGR':
      return [data[index + 3]!, data[index + 2]!, data[index + 1]!];
    case 'ARGB':
    case 'XRGB':
      return [data[index + 1]!, data[index + 2]!, data[index + 3]!];
    case 'BGR':
      return [data[index + 2]!, data[index + 1]!, data[index]!];
    case 'RGB':
      return [data[index]!, data[index + 1]!, data[index + 2]!];
    default:
      return [data[index]!, data[index + 1]!, data[index + 2]!];
  }
}

function bpp(format: string) {
  return format === 'RGB' || format === 'BGR' ? 3 : 4;
}

export function evaluateFootInOutline(
  buffer: ArrayBuffer,
  width: number,
  height: number,
  pixelFormat: string,
  prevGrid: SampleGrid | null,
): FitProbeResult & { grid: SampleGrid } {
  const data = new Uint8Array(buffer);
  const bytes = bpp(pixelFormat);
  const crop = cadreNormRect(width, height);
  const roiW = Math.floor(width * crop.width);
  const roiH = Math.floor(height * crop.height);
  const originX = Math.floor(width * crop.x);
  const originY = Math.floor(height * crop.y);

  const grid = new Float32Array(GRID_W * GRID_H);
  let foot = 0;
  let total = 0;
  let sum = 0;
  let sumSq = 0;

  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const nx = ((gx + 0.5) / GRID_W) * 2 - 1;
      const ny = ((gy + 0.5) / GRID_H) * 2 - 1;
      if (nx * nx + ny * ny * 0.7 > 1) {
        grid[gy * GRID_W + gx] = -1;
        continue;
      }
      const x = Math.min(
        width - 1,
        Math.floor(originX + ((gx + 0.5) / GRID_W) * roiW),
      );
      const y = Math.min(
        height - 1,
        Math.floor(originY + ((gy + 0.5) / GRID_H) * roiH),
      );
      const idx = (y * width + x) * bytes;
      if (idx + 2 >= data.length) {
        grid[gy * GRID_W + gx] = 0;
        continue;
      }
      const [r, g, b] = readRgb(data, idx, pixelFormat);
      const lum = luminance(r, g, b);
      grid[gy * GRID_W + gx] = lum;
      sum += lum;
      sumSq += lum * lum;
      total += 1;
      if (isFootLikeTone(r, g, b)) {
        foot += 1;
      }
    }
  }

  const mean = total > 0 ? sum / total : 0;
  const variance = total > 0 ? sumSq / total - mean * mean : 0;
  const footRatio = total > 0 ? foot / total : 0;

  // Foot present in the hole — keep this simple.
  const inFrame = footRatio >= 0.12 && variance >= 40;

  let motion = 999;
  let still = false;
  if (prevGrid && prevGrid.length === grid.length) {
    let diff = 0;
    let n = 0;
    for (let i = 0; i < grid.length; i++) {
      const a = prevGrid[i]!;
      const b = grid[i]!;
      if (a < 0 || b < 0) {
        continue;
      }
      diff += Math.abs(a - b);
      n += 1;
    }
    if (n > 0) {
      motion = diff / n;
      still = motion < 16;
    }
  }

  return {
    inFrame,
    still: inFrame && still,
    confidence: inFrame ? Math.min(1, footRatio * 3) : 0,
    footAreaRatio: Math.min(0.75, footRatio * 1.5),
    sharpness: Math.min(200, Math.sqrt(Math.max(0, variance))),
    legSpill: false,
    grid,
  };
}
