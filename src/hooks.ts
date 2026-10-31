import { useEffect, useState } from 'react';
import type { OsintEvent } from './types';
import { subscribeActiveEvents } from './services/events';
import { buildSampleEvents } from './data/sampleEvents';

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export type FeedStatus = 'connecting' | 'live' | 'demo';

/**
 * Live 24h events from Firestore. When `demoFallback` is set and Firestore is
 * empty or unreachable, renders local sample pins instead (never written).
 */
export function useActiveEvents(demoFallback: boolean) {
  const [events, setEvents] = useState<OsintEvent[]>([]);
  const [status, setStatus] = useState<FeedStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const now = useNow(30_000);

  useEffect(() => {
    if (!demoFallback) return;
    const t = setTimeout(() => {
      setStatus((s) => {
        if (s !== 'connecting') return s;
        setEvents(buildSampleEvents());
        return 'demo';
      });
    }, 4000);
    return () => clearTimeout(t);
  }, [demoFallback]);

  useEffect(
    () =>
      subscribeActiveEvents(
        (list, fromCache) => {
          setError(fromCache ? 'Backend unreachable — showing cached data' : null);
          if (!list.length && demoFallback) {
            setEvents(buildSampleEvents());
            setStatus('demo');
          } else {
            setEvents(list);
            setStatus('live');
          }
        },
        (err) => {
          setError(err.message);
          if (demoFallback) {
            setEvents(buildSampleEvents());
            setStatus('demo');
          }
        },
      ),
    [demoFallback],
  );

  return { events: events.filter((e) => e.expiresAt > now), status, error, now };
}
