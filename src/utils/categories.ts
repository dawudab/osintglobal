import type { EventCategory } from '../types';

export const CATEGORIES: Record<EventCategory, { label: string; color: string }> = {
  strike: { label: 'STRIKE', color: '#ef4444' },
  military_movement: { label: 'MIL MOVEMENT', color: '#f59e0b' },
  infrastructure: { label: 'INFRASTRUCTURE', color: '#10b981' },
  civilian: { label: 'CIVILIAN', color: '#a855f7' },
  general: { label: 'GENERAL', color: '#06b6d4' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as EventCategory[];

export const isCategory = (v: unknown): v is EventCategory => typeof v === 'string' && v in CATEGORIES;

export function hexToRgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
