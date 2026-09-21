import type { Photo } from 'react-native-vision-camera';
import { cadreCropRect } from './cadreGeometry';

/**
 * Save ONLY the pixels inside the on-screen cadre (centered foot hole).
 * Full camera frame is never uploaded.
 */
export async function cropFootForUpload(photo: Photo): Promise<string> {
  const image = await photo.toImageAsync();
  try {
    const { x0, y0, x1, y1, width, height } = cadreCropRect(
      image.width,
      image.height,
    );

    if (width < 32 || height < 32) {
      throw new Error('Cadre crop too small');
    }

    const cropped = await image.cropAsync(x0, y0, x1, y1);
    try {
      const targetW = 768;
      const targetH = Math.max(64, Math.round(targetW * (height / width)));
      const sized = await cropped.resizeAsync(targetW, targetH);
      try {
        return await sized.saveToTemporaryFileAsync('jpg', 92);
      } finally {
        sized.dispose();
      }
    } finally {
      cropped.dispose();
    }
  } finally {
    image.dispose();
  }
}
