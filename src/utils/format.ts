import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { OsintEvent } from '../types';
import { CATEGORIES } from './categories';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function formatAgo(ts: number, now = Date.now()) {
  const mins = Math.max(0, Math.floor((now - ts) / 60000));
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;
  return `${Math.floor(mins / 60)}H AGO`;
}

export function formatCoords(lat: number, lng: number) {
  const la = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}`;
  const ln = `${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;
  return `${la} / ${ln}`;
}

export const formatUtc = (d: Date) => d.toISOString().slice(11, 19) + ' UTC';

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function sitrepText(e: OsintEvent) {
  const ts = new Date(e.createdAt).toISOString().replace('T', ' ').slice(0, 16) + 'Z';
  return [
    `// SITREP — ${CATEGORIES[e.category].label}`,
    e.title.toUpperCase(),
    `LOC: ${e.locationName} (${formatCoords(e.lat, e.lng)})`,
    `DTG: ${ts}`,
    '',
    e.summary,
    e.sourceUrl ? `\nSRC: ${e.sourceUrl}` : '',
    '— CENTCOM // OSINT TRACKER',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
