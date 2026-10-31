import { useEffect, useMemo, useRef, useState } from 'react';
import { Filter, List, Map as MapIcon } from 'lucide-react';
import GlobeView, { type GlobeHandle } from '../components/GlobeView';
import Panel from '../components/Panel';
import SitrepCard from '../components/SitrepCard';
import CategoryBadge from '../components/CategoryBadge';
import { useActiveEvents, useNow } from '../hooks';
import type { EventCategory, OsintEvent } from '../types';
import { CATEGORIES, CATEGORY_KEYS, hexToRgba } from '../utils/categories';
import { cn, formatAgo, formatUtc } from '../utils/format';

type Sheet = 'map' | 'feed' | 'filter';

const mq = () => window.matchMedia('(min-width: 768px)');

function useIsDesktop() {
  const [d, setD] = useState(() => mq().matches);
  useEffect(() => {
    const m = mq();
    const fn = () => setD(m.matches);
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, []);
  return d;
}

function UtcClock() {
  const now = useNow(1000);
  return <span className="tabular-nums text-radar">{formatUtc(new Date(now))}</span>;
}

export default function GlobePage() {
  const { events, status, now } = useActiveEvents(true);
  const isDesktop = useIsDesktop();
  const globe = useRef<GlobeHandle>(null);
  const [sheet, setSheet] = useState<Sheet>(() => (mq().matches ? 'feed' : 'map'));
  const [selectedId, setSelectedId] = useState<string>();
  const [hidden, setHidden] = useState<Set<EventCategory>>(new Set());

  const visible = useMemo(() => events.filter((e) => !hidden.has(e.category)), [events, hidden]);
  const selected = visible.find((e) => e.id === selectedId);
  const counts = useMemo(
    () => Object.fromEntries(CATEGORY_KEYS.map((k) => [k, events.filter((e) => e.category === k).length])) as Record<EventCategory, number>,
    [events],
  );

  const select = (e: OsintEvent, fly: boolean) => {
    setSelectedId(e.id);
    if (!isDesktop || sheet === 'filter') setSheet(isDesktop ? 'feed' : 'map');
    if (fly) globe.current?.flyTo(e.lat, e.lng);
  };

  const toggleSheet = (s: Sheet) => {
    setSheet((cur) => (cur === s && s !== 'map' ? 'map' : s));
    if (s !== 'map' && !isDesktop) setSelectedId(undefined);
    if (s === 'filter' && isDesktop) setSelectedId(undefined);
  };

  const toggleCat = (c: EventCategory) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  return (
    <main className="scanlines relative h-[100dvh] w-screen select-none overflow-hidden bg-void">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.06),transparent_60%)]" />
      <GlobeView ref={globe} events={visible} selectedId={selectedId} onSelect={(e) => select(e, true)} />

      <header className="glass fixed inset-x-2 top-[calc(env(safe-area-inset-top)+8px)] z-40 flex items-center justify-between rounded-lg px-3 py-2 md:inset-x-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="truncate text-[11px] font-bold tracking-[0.18em] text-amber md:text-sm">
            CENTCOM <span className="text-amber/50">//</span> OSINT TRACKER
          </h1>
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold tracking-widest text-emerald-400">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            {status === 'demo' ? 'DEMO' : status === 'live' ? 'LIVE' : 'SYNC'}
          </span>
          <span className="shrink-0 rounded-sm border border-radar/40 bg-radar/10 px-1.5 py-0.5 text-[10px] font-bold text-radar">
            {events.length}
            <span className="hidden sm:inline"> / 24H</span>
          </span>
        </div>
        <div className="shrink-0 text-[11px] font-bold tracking-widest md:text-xs">
          <UtcClock />
        </div>
      </header>

      <Panel open={sheet === 'feed'} onClose={() => setSheet('map')} title={`// LIVE FEED — ${visible.length} ACTIVE`} side="left">
        {visible.length === 0 ? (
          <p className="p-6 text-center text-xs tracking-widest text-slate-500">// NO ACTIVE EVENTS IN WINDOW</p>
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {visible.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => select(e, true)}
                  className={cn(
                    'flex w-full gap-3 px-4 py-3 text-left transition active:bg-amber/10',
                    e.id === selectedId && 'bg-amber/10',
                  )}
                  style={{ borderLeft: `3px solid ${CATEGORIES[e.category].color}` }}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <CategoryBadge category={e.category} />
                      <span className="text-[10px] font-bold tracking-widest text-radar/80">{formatAgo(e.createdAt, now)}</span>
                    </div>
                    <div className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-100">{e.title}</div>
                    <div className="truncate text-[10px] tracking-wider text-amber/80">{e.locationName}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel open={sheet === 'filter'} onClose={() => setSheet('map')} title="// FILTER / LEGEND" side="right" className="md:bottom-auto">
        <div className="grid grid-cols-1 gap-2 p-4">
          {CATEGORY_KEYS.map((k) => {
            const { label, color } = CATEGORIES[k];
            const on = !hidden.has(k);
            return (
              <button
                key={k}
                onClick={() => toggleCat(k)}
                aria-pressed={on}
                className="flex min-h-[48px] items-center justify-between rounded border px-3 text-xs font-bold tracking-widest transition active:scale-[0.98]"
                style={{
                  color: on ? color : '#64748b',
                  borderColor: on ? hexToRgba(color, 0.6) : '#1e293b',
                  background: on ? hexToRgba(color, 0.1) : 'transparent',
                }}
              >
                <span className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: on ? color : '#334155', boxShadow: on ? `0 0 8px ${color}` : 'none' }} />
                  {label}
                </span>
                <span className="tabular-nums">{counts[k]}</span>
              </button>
            );
          })}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="tac-btn" onClick={() => setHidden(new Set())}>[ ALL ]</button>
            <button className="tac-btn" onClick={() => setHidden(new Set(CATEGORY_KEYS))}>[ NONE ]</button>
          </div>
        </div>
      </Panel>

      <Panel open={!!selected} onClose={() => setSelectedId(undefined)} title="// SITREP" side="right" className="md:bottom-auto md:max-h-[calc(100dvh-11rem)]">
        {selected && <SitrepCard event={selected} now={now} onFocus={() => globe.current?.flyTo(selected.lat, selected.lng, 0.8)} />}
      </Panel>

      <nav className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+8px)] z-40 grid grid-cols-3 gap-2 md:left-1/2 md:right-auto md:w-[460px] md:-translate-x-1/2">
        {(
          [
            ['map', <MapIcon key="i" size={15} />, '[ MAP ]'],
            ['feed', <List key="i" size={15} />, `[ FEED (${visible.length}) ]`],
            ['filter', <Filter key="i" size={15} />, '[ FILTER ]'],
          ] as const
        ).map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => toggleSheet(key)}
            className={cn('tac-btn glass min-h-[52px] px-1 text-[10px] sm:text-xs', sheet === key && 'tac-btn-active')}
          >
            {icon}
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
