import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import type { EventDraft, OsintEvent } from '../types';
import { isCategory } from '../utils/categories';
import { DAY_MS, fuzzTimestamp, sanitizeUrl } from '../utils/opsec';
import { buildSampleEvents } from '../data/sampleEvents';

const eventsCol = collection(db, 'events');

function parseDoc(id: string, d: Record<string, unknown>): OsintEvent | null {
  const lat = Number(d.lat);
  const lng = Number(d.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || typeof d.title !== 'string') return null;
  return {
    id,
    title: d.title,
    summary: String(d.summary ?? ''),
    locationName: String(d.locationName ?? ''),
    lat,
    lng,
    category: isCategory(d.category) ? d.category : 'general',
    sourceUrl: typeof d.sourceUrl === 'string' ? sanitizeUrl(d.sourceUrl).url || undefined : undefined,
    mediaUrl: typeof d.mediaUrl === 'string' && /^(data:image\/|https:\/\/)/.test(d.mediaUrl) ? d.mediaUrl : undefined,
    createdAt: Number(d.createdAt) || 0,
    expiresAt: Number(d.expiresAt) || 0,
  };
}

/** Live subscription to events that haven't expired yet, newest first. */
export function subscribeActiveEvents(onData: (events: OsintEvent[], fromCache: boolean) => void, onError: (err: Error) => void) {
  const q = query(eventsCol, where('expiresAt', '>', Date.now()));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      const now = Date.now();
      const events = snap.docs
        .map((s) => parseDoc(s.id, s.data()))
        .filter((e): e is OsintEvent => !!e && e.expiresAt > now)
        .sort((a, b) => b.createdAt - a.createdAt);
      onData(events, snap.metadata.fromCache);
    },
    onError,
  );
}

/** Builds a strictly-anonymous document: only schema fields, no undefined values. */
function toDoc(e: EventDraft & { mediaUrl?: string; createdAt: number }) {
  const out: Omit<OsintEvent, 'id'> = {
    title: e.title.trim().slice(0, 60),
    summary: e.summary.trim(),
    locationName: e.locationName.trim(),
    lat: Math.max(-90, Math.min(90, e.lat)),
    lng: Math.max(-180, Math.min(180, e.lng)),
    category: e.category,
    createdAt: e.createdAt,
    expiresAt: e.createdAt + DAY_MS,
  };
  const src = e.sourceUrl ? sanitizeUrl(e.sourceUrl).url : '';
  if (src) out.sourceUrl = src;
  if (e.mediaUrl) out.mediaUrl = e.mediaUrl;
  return out;
}

// Firestore queues writes indefinitely while offline; surface that as an error instead of hanging.
function withTimeout<T>(p: Promise<T>, ms = 15_000): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore unreachable (timeout) — check that Firestore is enabled and rules allow writes')), ms)),
  ]);
}

export const publishEvent = (draft: EventDraft & { mediaUrl?: string }) =>
  withTimeout(addDoc(eventsCol, toDoc({ ...draft, createdAt: fuzzTimestamp() })));

export const purgeEvent = (id: string) => withTimeout(deleteDoc(doc(db, 'events', id)));

export function seedSampleEvents() {
  const batch = writeBatch(db);
  for (const { id: _id, ...e } of buildSampleEvents()) batch.set(doc(eventsCol), toDoc(e));
  return withTimeout(batch.commit());
}
