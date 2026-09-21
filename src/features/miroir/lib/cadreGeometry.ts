/** Shared cadre geometry — on-screen hole and saved crop must match. */
export const CADRE = {
  sizeOnShortSide: 0.7,
  /** Foot-shaped oval (taller than wide). */
  aspect: 152 / 248,
} as const;

export function cadreCropRect(imageWidth: number, imageHeight: number) {
  const short = Math.min(imageWidth, imageHeight);
  let w = short * CADRE.sizeOnShortSide;
  let h = w / CADRE.aspect;

  if (h > imageHeight * 0.88) {
    h = imageHeight * 0.88;
    w = h * CADRE.aspect;
  }
  if (w > imageWidth * 0.9) {
    w = imageWidth * 0.9;
    h = w / CADRE.aspect;
  }

  const x0 = (imageWidth - w) / 2;
  const y0 = (imageHeight - h) / 2;
  return { x0, y0, x1: x0 + w, y1: y0 + h, width: w, height: h };
}

export function cadreNormRect(imageWidth: number, imageHeight: number) {
  const r = cadreCropRect(imageWidth, imageHeight);
  return {
    x: r.x0 / imageWidth,
    y: r.y0 / imageHeight,
    width: r.width / imageWidth,
    height: r.height / imageHeight,
  };
}

export function cadreScreenHole(sw: number, sh: number) {
  const short = Math.min(sw, sh);
  let holeW = short * CADRE.sizeOnShortSide;
  let holeH = holeW / CADRE.aspect;
  if (holeH > sh * 0.55) {
    holeH = sh * 0.55;
    holeW = holeH * CADRE.aspect;
  }
  return {
    holeW,
    holeH,
    holeLeft: (sw - holeW) / 2,
    holeTop: (sh - holeH) / 2 - sh * 0.02,
  };
}
