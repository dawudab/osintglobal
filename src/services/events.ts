import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from './firebase';
import type { EventDraft, OsintEvent } from '../types';
import { getEventTags, isCategory, tagsToCategory } from '../utils/categories';
import { DAY_MS, fuzzTimestamp, sanitizeUrl } from '../utils/opsec';
import { buildSampleEvents } from '../data/sampleEvents';

const eventsCol = collection(db, 'events');

// Local session cache of tags keyed by event id or title+createdAt in case remote Firestore rules strip unknown fields
const localTagsCache = new Map<string, string[]>();

function cacheKey(title: string, createdAt: number) {
  return `${title.trim().slice(0, 60)}::${createdAt}`;
}

function parseDoc(id: string, d: Record<string, unknown>): OsintEvent | null {
  const lat = Number(d.lat);
  const lng = Number(d.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || typeof d.title !== 'string') return null;
  const category = isCategory(d.category) ? d.category : 'general';
  const createdAt = Number(d.createdAt) || 0;
  const rawTags = Array.isArray(d.tags)
    ? d.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim())
    : [];
  const cached = localTagsCache.get(id) ?? localTagsCache.get(cacheKey(d.title, createdAt));
  const tags = rawTags.length > 0 ? rawTags : cached && cached.length > 0 ? cached : getEventTags({ category, tags: [] });

  return {
    id,
    title: d.title,
    summary: String(d.summary ?? ''),
    locationName: String(d.locationName ?? ''),
    lat,
    lng,
    category,
    tags,
    sourceUrl: typeof d.sourceUrl === 'string' ? sanitizeUrl(d.sourceUrl).url || undefined : undefined,
    mediaUrl: typeof d.mediaUrl === 'string' && /^(data:image\/|https?:\/\/)/.test(d.mediaUrl) ? d.mediaUrl : undefined,
    createdAt,
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

/** One-shot query to poll Firestore for active events (used for 60-second periodic live polling) */
export async function fetchActiveEvents(): Promise<OsintEvent[]> {
  const now = Date.now();
  const q = query(eventsCol, where('expiresAt', '>', now));
  const snap = await withTimeout(getDocs(q));
  return snap.docs
    .map((s) => parseDoc(s.id, s.data()))
    .filter((e): e is OsintEvent => !!e && e.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Builds a strictly-anonymous document: only schema fields, no undefined values. */
function toDoc(e: EventDraft & { mediaUrl?: string; createdAt: number }, includeTags = true) {
  const cleanTags = (e.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 8);
  const tags = cleanTags.length > 0 ? cleanTags : getEventTags({ category: e.category, tags: [] });
  const category = e.category || tagsToCategory(tags);

  const out: Record<string, unknown> = {
    title: e.title.trim().slice(0, 60),
    summary: e.summary.trim().slice(0, 1000),
    locationName: e.locationName.trim().slice(0, 200),
    lat: Math.max(-90, Math.min(90, Number(e.lat) || 0)),
    lng: Math.max(-180, Math.min(180, Number(e.lng) || 0)),
    category,
    createdAt: e.createdAt,
    expiresAt: e.createdAt + DAY_MS,
  };
  if (includeTags) {
    out.tags = tags;
  }
  const src = e.sourceUrl ? sanitizeUrl(e.sourceUrl).url : '';
  if (src) out.sourceUrl = src;
  const media = e.mediaUrl?.trim();
  if (media && /^(data:image\/|https?:\/\/)/.test(media)) {
    out.mediaUrl = media;
  }
  return out;
}

// Firestore queues writes indefinitely while offline; surface that as an error instead of hanging.
function withTimeout<T>(p: Promise<T>, ms = 15_000): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore unreachable (timeout) — check network and Firestore rules')), ms),
    ),
  ]);
}

async function ensureWriteSession() {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch {
      // Proceed even if anonymous auth is disabled on the Firebase project
    }
  }
}

export async function publishEvent(draft: EventDraft & { mediaUrl?: string }) {
  await ensureWriteSession();
  const createdAt = fuzzTimestamp();
  const cleanTags = (draft.tags ?? []).map((t) => t.trim()).filter(Boolean);
  if (cleanTags.length > 0) {
    localTagsCache.set(cacheKey(draft.title, createdAt), cleanTags);
  }
  try {
    const ref = await withTimeout(addDoc(eventsCol, toDoc({ ...draft, createdAt }, true)));
    if (cleanTags.length > 0) localTagsCache.set(ref.id, cleanTags);
    return ref;
  } catch (err) {
    // Fallback if remote Firestore rules haven't been redeployed with `tags` in hasOnly() yet
    if (/permission|missing or insufficient/i.test(String((err as Error)?.message))) {
      const ref = await withTimeout(addDoc(eventsCol, toDoc({ ...draft, createdAt }, false)));
      if (cleanTags.length > 0) localTagsCache.set(ref.id, cleanTags);
      return ref;
    }
    throw err;
  }
}

export async function purgeEvent(id: string) {
  await ensureWriteSession();
  return withTimeout(deleteDoc(doc(db, 'events', id)));
}

export async function seedSampleEvents() {
  await ensureWriteSession();
  const samples = buildSampleEvents();
  try {
    const batch = writeBatch(db);
    for (const sample of samples) {
      localTagsCache.set(cacheKey(sample.title, sample.createdAt), sample.tags);
      batch.set(doc(eventsCol), toDoc(sample, true));
    }
    return await withTimeout(batch.commit());
  } catch {
    const batch = writeBatch(db);
    for (const sample of samples) {
      localTagsCache.set(cacheKey(sample.title, sample.createdAt), sample.tags);
      batch.set(doc(eventsCol), toDoc(sample, false));
    }
    return await withTimeout(batch.commit());
  }
}
