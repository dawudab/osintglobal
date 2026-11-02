import { useEffect, useMemo, useRef, useState } from 'react';
import { Filter, List, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import GlobeView, { type GlobeHandle } from '../components/GlobeView';
import Panel from '../components/Panel';
import SitrepCard from '../components/SitrepCard';
import CategoryBadge from '../components/CategoryBadge';
import WorldTimeTicker from '../components/WorldTimeTicker';
import NetworkSettingsModal, { type SiteSettings } from '../components/NetworkSettingsModal';
import { useActiveEvents } from '../hooks';
import { useCyberTransition } from '../context/CyberTransitionContext';
import type { OsintEvent } from '../types';
import { getEventTags, isAlertTag } from '../utils/categories';
import { cn, formatAgo } from '../utils/format';

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

export default function GlobePage() {
  const { events, status, now } = useActiveEvents();
  const { cyberNavigate } = useCyberTransition();
  const isDesktop = useIsDesktop();
  const globe = useRef<GlobeHandle>(null);
  const [sheet, setSheet] = useState<Sheet>(() => (mq().matches ? 'feed' : 'map'));
  const [selectedId, setSelectedId] = useState<string>();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // User-configurable site visual preferences
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('rn_site_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      soundEnabled: true,
      autoRotate: true,
      atmosphereGlow: true,
    };
  });

  const handleUpdateSettings = (updater: (prev: SiteSettings) => SiteSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem('rn_site_settings', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Dynamically extract unique tags and counts from active events
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      for (const t of getEventTags(e)) {
        map.set(t, (map.get(t) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [events]);

  // Reset activeTag if it no longer exists in active events
  useEffect(() => {
    if (activeTag && !tagCounts.some(([t]) => t === activeTag)) {
      setActiveTag(null);
    }
  }, [activeTag, tagCounts]);

  const visible = useMemo(() => {
    if (!activeTag) return events;
    return events.filter((e) => getEventTags(e).includes(activeTag));
  }, [events, activeTag]);

  const selected = visible.find((e) => e.id === selectedId);

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

  return (
    <main className="wire-mesh relative h-[100dvh] w-screen select-none overflow-hidden bg-black">
      <GlobeView
        ref={globe}
        events={visible}
        selectedId={selectedId}
        onSelect={(e) => select(e, true)}
        autoRotate={settings.autoRotate}
        showAtmosphere={settings.atmosphereGlow}
      />

      {/* Monochromatic Bittensor Glass Top HUD + World Time Scroller + Tag Filter Strip */}
      <div className="fixed inset-x-2 top-[calc(env(safe-area-inset-top)+8px)] z-40 space-y-2 md:inset-x-6 pointer-events-none">
        {/* Top Header: GRN Brand + Active Status + Settings Window Trigger */}
        <header className="glass pointer-events-auto flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 sm:px-4 shadow-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse shrink-0" />
            <h1 className="text-base sm:text-lg font-black tracking-widest text-white uppercase font-mono shrink-0">
              GRN
            </h1>
            <span className="text-[9px] tracking-wider text-zinc-400 font-mono border border-white/10 rounded px-1.5 py-0.5 bg-white/[0.03] shrink-0">
              P2P NODE
            </span>
            <span className="hidden md:inline-block text-[11px] font-mono text-zinc-400 truncate tracking-tight">
              Decentralized Frontline Intelligence & Global Reporting
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Active Count Badge */}
            <span className="shrink-0 rounded-xl border border-white/20 bg-white/[0.04] px-2.5 py-1.5 text-[10px] sm:text-[11px] font-mono text-zinc-300 tabular-nums whitespace-nowrap">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full inline-block mr-1.5 align-middle',
                  status === 'live' ? 'bg-white animate-pulse' : 'bg-zinc-500',
                )}
              />
              {events.length > 0 ? `${visible.length} ACTIVE` : 'MONITORING'}
            </span>

            {/* Settings & System Window Trigger Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              aria-label="GRN Settings and System Control"
              title="GRN Settings and System Control"
              className="tac-btn min-h-[36px] px-3 text-[11px] font-mono whitespace-nowrap rounded-xl border-white/20 hover:border-white hover:bg-white/10 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <SlidersHorizontal size={14} className="text-white" />
              <span className="hidden sm:inline">MENU</span>
            </button>
          </div>
        </header>

        {/* World Time Banner Scroller */}
        <div className="glass pointer-events-auto overflow-hidden rounded-xl border border-white/10 bg-black/90 px-3 py-1.5 shadow-md">
          <WorldTimeTicker />
        </div>

        {/* Dynamic Tag Filter Bar built from unique active event tags */}
        {tagCounts.length > 0 && (
          <div
            role="toolbar"
            aria-label="Filter dispatches by tag"
            className="no-scrollbar pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-0.5"
          >
            <button
              onClick={() => setActiveTag(null)}
              className={cn(
                'min-h-[38px] shrink-0 rounded-xl px-3 text-[10px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap border backdrop-blur-xl',
                activeTag === null
                  ? 'border-white bg-white text-black font-bold shadow-sm'
                  : 'border-white/10 bg-black/60 text-zinc-400 hover:text-white hover:border-white/25',
              )}
            >
              ALL ({events.length})
            </button>
            {tagCounts.map(([tag, count]) => {
              const isSelected = activeTag === tag;
              const isAlert = isAlertTag(tag);
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag((cur) => (cur === tag ? null : tag))}
                  className={cn(
                    'min-h-[38px] shrink-0 rounded-xl px-3 text-[10px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap border backdrop-blur-xl',
                    isSelected
                      ? isAlert
                        ? 'border-crimson bg-crimson text-white font-bold'
                        : 'border-white bg-white text-black font-bold'
                      : isAlert
                        ? 'border-crimson/40 bg-crimson/10 text-crimson hover:bg-crimson/20'
                        : 'border-white/10 bg-black/60 text-zinc-400 hover:text-white hover:border-white/25',
                  )}
                >
                  {tag} <span className="tabular-nums opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Event Feed (iOS Bottom Sheet on Mobile, Left Panel on Desktop) */}
      <Panel
        open={sheet === 'feed'}
        onClose={() => setSheet('map')}
        title={`GLOBAL DISPATCH FEED · ${visible.length} ACTIVE`}
        side="left"
      >
        {visible.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">NO ACTIVE FRONTLINE DISPATCHES</p>
            <p className="text-[11px] text-zinc-500 font-mono max-w-xs mx-auto leading-relaxed">
              Decentralized sensors are scanning global channels. Verified dispatches published to the network will appear here automatically.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {visible.map((e) => {
              const isSelected = e.id === selectedId;
              return (
                <li key={e.id}>
                  <button
                    onClick={() => select(e, true)}
                    className={cn(
                      'flex min-h-[64px] w-full gap-3 px-4 py-3.5 text-left transition-colors active:bg-white/[0.08]',
                      isSelected ? 'bg-white/[0.08] border-l-2 border-white' : 'hover:bg-white/[0.03]',
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <CategoryBadge category={e.category} tags={e.tags} />
                        <span className="shrink-0 text-[10px] text-zinc-400 tabular-nums font-mono">
                          {formatAgo(e.createdAt, now)}
                        </span>
                      </div>
                      <div className="line-clamp-2 text-[13px] font-semibold leading-snug text-white tracking-tight">{e.title}</div>
                      <div className="truncate text-[10px] tracking-wider text-zinc-400">{e.locationName}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* Dynamic Tag Filter Sheet */}
      <Panel
        open={sheet === 'filter'}
        onClose={() => setSheet('map')}
        title="DISPATCH TAG DIRECTORY"
        side="right"
        className="md:bottom-auto md:max-h-[calc(100dvh-12rem)]"
      >
        <div className="grid grid-cols-1 gap-2 p-4">
          <button
            onClick={() => setActiveTag(null)}
            aria-pressed={activeTag === null}
            className={cn(
              'flex min-h-[48px] items-center justify-between rounded-xl border px-4 text-xs font-semibold uppercase tracking-wider transition active:scale-[0.98]',
              activeTag === null
                ? 'border-white bg-white text-black font-bold shadow-[0_0_16px_rgba(255,255,255,0.2)]'
                : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:text-white hover:border-white/30 hover:bg-white/[0.05]',
            )}
          >
            <span className="flex items-center gap-2.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', activeTag === null ? 'bg-black' : 'bg-white/40')} />
              <span>ALL DISPATCHES</span>
            </span>
            <span className="tabular-nums font-mono text-[11px] opacity-80">{events.length}</span>
          </button>
          {tagCounts.map(([tag, count]) => {
            const on = activeTag === tag;
            const alert = isAlertTag(tag);
            return (
              <button
                key={tag}
                onClick={() => setActiveTag((cur) => (cur === tag ? null : tag))}
                aria-pressed={on}
                className={cn(
                  'flex min-h-[48px] items-center justify-between rounded-xl border px-4 text-xs font-semibold uppercase tracking-wider transition active:scale-[0.98]',
                  on
                    ? alert
                      ? 'border-crimson bg-crimson text-white font-bold shadow-[0_0_16px_rgba(239,68,68,0.3)]'
                      : 'border-white bg-white text-black font-bold shadow-[0_0_16px_rgba(255,255,255,0.2)]'
                    : alert
                      ? 'border-crimson/30 bg-crimson/[0.06] text-crimson hover:bg-crimson/15 hover:border-crimson/60'
                      : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:text-white hover:border-white/30 hover:bg-white/[0.05]',
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      on ? (alert ? 'bg-white' : 'bg-black') : (alert ? 'bg-crimson' : 'bg-white/40'),
                    )}
                  />
                  <span>{tag}</span>
                </span>
                <span className="tabular-nums font-mono text-[11px] opacity-80">{count}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* News Dispatch Detail View */}
      <Panel
        open={!!selected}
        onClose={() => setSelectedId(undefined)}
        title="NEWS DISPATCH"
        side="right"
        className="md:bottom-auto md:max-h-[calc(100dvh-12rem)]"
      >
        {selected && (
          <SitrepCard
            event={selected}
            now={now}
          />
        )}
      </Panel>

      {/* Bottom iOS-style Segmented Thumb Navigation */}
      <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+8px)] z-40 grid grid-cols-3 gap-2 md:left-1/2 md:right-auto md:w-[480px] md:-translate-x-1/2">
        {(
          [
            ['map', <MapIcon key="i" size={15} />, '[ GLOBE ]'],
            ['feed', <List key="i" size={15} />, `[ FEED (${visible.length}) ]`],
            ['filter', <Filter key="i" size={15} />, activeTag ? `[ ${activeTag.toUpperCase()} ]` : '[ TAGS ]'],
          ] as const
        ).map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => toggleSheet(key)}
            className={cn(
              'tac-btn glass min-h-[48px] px-2 text-[10px] sm:text-xs whitespace-nowrap rounded-2xl border-white/10',
              sheet === key && 'tac-btn-active',
            )}
          >
            {icon}
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      {/* Dedicated Root-Level Settings & System Window */}
      <NetworkSettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onAdminClick={() => cyberNavigate('/admin', 'SECURITY CLEARANCE')}
      />
    </main>
  );
}
