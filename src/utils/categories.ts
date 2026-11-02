import { BASE_TAGS, type EventCategory, type OsintEvent } from '../types';

// Bittensor monochrome aesthetic: Crisp White, Platinum Silver, and Crimson for critical alerts
export const CATEGORIES: Record<EventCategory, { label: string; color: string; defaultTag: string }> = {
  strike: { label: 'CONFLICT', color: '#ef4444', defaultTag: 'Conflict' },
  military_movement: { label: 'GOVERNMENT', color: '#e4e4e7', defaultTag: 'Government' },
  infrastructure: { label: 'TECH / NETWORK', color: '#ffffff', defaultTag: 'Tech/Cyber' },
  civilian: { label: 'HUMAN RIGHTS', color: '#f87171', defaultTag: 'Human Rights' },
  general: { label: 'DISPATCH', color: '#d4d4d8', defaultTag: 'Protest' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as EventCategory[];

export const isCategory = (v: unknown): v is EventCategory => typeof v === 'string' && v in CATEGORIES;

export function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Map a list of tags to a backward-compatible EventCategory for Firestore schema compliance */
export function tagsToCategory(tags: string[]): EventCategory {
  const joined = tags.join(' ').toLowerCase();
  if (/conflict|strike|attack|war|explosion|military|security|clash/.test(joined)) return 'strike';
  if (/human rights|civilian|humanitarian|displacement|aid|censorship|detain/.test(joined)) return 'civilian';
  if (/tech|cyber|outage|infrastructure|network|blackout|grid|bittensor|subnet|crypto|ai/.test(joined)) return 'infrastructure';
  if (/government|election|policy|sanction|parliament|court|diplomacy|regime/.test(joined)) return 'military_movement';
  return 'general';
}

/** Ensure every event always has at least 1 normalized tag */
export function getEventTags(e: Pick<OsintEvent, 'category' | 'tags'>): string[] {
  if (Array.isArray(e.tags) && e.tags.length > 0) {
    return e.tags.map((t) => t.trim()).filter(Boolean);
  }
  const fallback = CATEGORIES[e.category]?.defaultTag ?? 'Protest';
  return [fallback];
}

/** Determine if a tag represents a high-priority / alert dispatch (Crimson #ef4444) */
export function isAlertTag(tag: string): boolean {
  return /conflict|crisis|strike|emergency|crackdown|alert|outage|breach|war/i.test(tag);
}

export function getTagColor(tag: string): string {
  if (isAlertTag(tag)) return '#ef4444';
  return '#ffffff';
}

export function getEventColor(e: Pick<OsintEvent, 'category' | 'tags'>): string {
  const tags = getEventTags(e);
  if (tags.some(isAlertTag) || e.category === 'strike') return '#ef4444';
  return '#ffffff';
}

export { BASE_TAGS };
