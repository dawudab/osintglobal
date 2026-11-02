import { useCallback, useEffect, useRef, useState } from 'react';
import type { OsintEvent } from './types';
import { fetchActiveEvents } from './services/events';

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export type FeedStatus = 'connecting' | 'live' | 'paused' | 'offline';

const POLL_INTERVAL_SECONDS = 60;

/**
 * 60-Second Autonomous Polling Feed for Firestore Dispatches.
 * Supports toggleable 'Live' mode, countdown timer, and background re-fetching
 * without full application reloads.
 */
export function useActiveEvents() {
  const [events, setEvents] = useState<OsintEvent[]>([]);
  const [status, setStatus] = useState<FeedStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(POLL_INTERVAL_SECONDS);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(() => Date.now());
  const now = useNow(15_000);

  const isPollingRef = useRef(false);

  const pollNow = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    setIsPolling(true);
    try {
      const data = await fetchActiveEvents();
      setEvents(data);
      setStatus(isLive ? 'live' : 'paused');
      setError(null);
      setLastSyncedAt(Date.now());
    } catch (err) {
      console.warn('Live polling warning:', err);
      // If we already have events, keep them; just note status
      setError('Relay sync latency — retained cached dispatches');
      if (events.length === 0) {
        setStatus('offline');
      }
    } finally {
      isPollingRef.current = false;
      setIsPolling(false);
      setSecondsRemaining(POLL_INTERVAL_SECONDS);
    }
  }, [isLive, events.length]);

  // Initial fetch on mount
  useEffect(() => {
    pollNow();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 60-second periodic countdown and auto-poll when 'isLive' is true
  useEffect(() => {
    if (!isLive) {
      setStatus('paused');
      return;
    }

    setStatus('live');
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Timer reached 0: poll Firestore now
          pollNow();
          return POLL_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLive, pollNow]);

  const toggleLive = useCallback(() => {
    setIsLive((prev) => {
      const next = !prev;
      if (next) {
        setSecondsRemaining(POLL_INTERVAL_SECONDS);
        pollNow();
      }
      return next;
    });
  }, [pollNow]);

  return {
    events: events.filter((e) => e.expiresAt > now),
    status,
    error,
    now,
    isLive,
    setIsLive,
    toggleLive,
    secondsRemaining,
    isPolling,
    lastSyncedAt,
    refetchNow: pollNow,
  };
}
