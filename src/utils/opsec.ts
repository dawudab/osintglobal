const TRACKING_PREFIXES = ['utm_', 'tg_'];
const TRACKING_KEYS = new Set(['fbclid', 'igshid', 'gclid', 'dclid', 'msclkid', 'mc_cid', 'mc_eid', 'yclid', 'twclid', 'ttclid', '_hsenc', '_hsmi']);

/** Strips tracking params; returns '' for anything that isn't a valid http(s) URL. */
export function sanitizeUrl(raw: string): { url: string; changed: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { url: '', changed: false };
  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return { url: '', changed: true };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return { url: '', changed: true };
  for (const key of [...parsed.searchParams.keys()]) {
    const k = key.toLowerCase();
    if (TRACKING_KEYS.has(k) || TRACKING_PREFIXES.some((p) => k.startsWith(p))) parsed.searchParams.delete(key);
  }
  parsed.username = '';
  parsed.password = '';
  const url = parsed.toString();
  return { url, changed: url !== trimmed };
}

/** Floors a timestamp to the minute to defeat second-level correlation. */
export const fuzzTimestamp = (ts: number = Date.now()) => Math.floor(ts / 60000) * 60000;

export const DAY_MS = 24 * 60 * 60 * 1000;

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if ('createImageBitmap' in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* fall through to <img> decode */
    }
  }
  const src = URL.createObjectURL(file);
  const img = new Image();
  img.src = src;
  await img.decode();
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(src) };
}

/**
 * Re-encodes an image through a canvas. Only raw pixels survive, so all EXIF,
 * GPS, camera serials and timestamps are destroyed. Result stays under ~900KB
 * so it fits in a single Firestore document.
 */
export async function scrubImage(file: File, maxDim = 1200, maxBytes = 900_000): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Not an image file');
  const { source, width, height, close } = await decode(file);
  try {
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    const webp = canvas.toDataURL('image/webp', 0.8).startsWith('data:image/webp');
    const type = webp ? 'image/webp' : 'image/jpeg';
    let quality = 0.8;
    let out = canvas.toDataURL(type, quality);
    while (out.length > maxBytes && quality > 0.3) {
      quality -= 0.1;
      out = canvas.toDataURL(type, quality);
    }
    if (out.length > maxBytes) throw new Error('Image too large after compression');
    return out;
  } finally {
    close();
  }
}
