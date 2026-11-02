import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import {
  Activity,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardPaste,
  Clock,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  ImagePlus,
  Layers,
  Loader2,
  Lock,
  MapPin,
  Plus,
  Radio,
  Search,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Wifi,
  X,
} from 'lucide-react';
import { useCyberTransition } from '../context/CyberTransitionContext';
import {
  AI_PRESETS,
  extractDispatchWithAi,
  geocode,
  getDefaultAiConfig,
  saveAiConfig,
  testAiConnection,
} from '../services/ai';
import { publishEvent, purgeEvent } from '../services/events';
import { useActiveEvents } from '../hooks';
import { BASE_TAGS, type AiConfig, type EventDraft, type OsintEvent } from '../types';
import { getEventTags, isAlertTag, tagsToCategory } from '../utils/categories';
import { cn, copyText, dispatchText, formatAgo, formatCoords, formatUtc } from '../utils/format';
import { sanitizeUrl, scrubImage } from '../utils/opsec';
import CategoryBadge from '../components/CategoryBadge';

const SESSION_FLAG = 'rn_admin_unlocked';
const rawEnvPass: string =
  import.meta.env.VITE_RN_ADMIN_PASSWORD || import.meta.env.VITE_OPERATOR_PASSPHRASE || '';
const CONFIGURED_PASSWORD = rawEnvPass === 'change-me' ? '' : rawEnvPass;

type Tab = 'overview' | 'publisher' | 'dispatches' | 'settings';

const EMPTY: EventDraft = {
  title: '',
  summary: '',
  locationName: '',
  lat: 0,
  lng: 0,
  category: 'general',
  tags: ['Protest'],
  sourceUrl: '',
  mediaUrl: '',
};

type Log = { kind: 'ok' | 'warn' | 'err' | 'info'; msg: string } | null;

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="glass rounded-2xl p-4 sm:p-5 border border-white/10 space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <h2 className="hud-label text-zinc-300 flex items-center gap-2">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-medium uppercase tracking-wider text-zinc-300">
        <span className="truncate">{label}</span>
        {hint}
      </span>
      {children}
    </label>
  );
}

function StatusLine({ log }: { log: Log }) {
  if (!log) return null;
  const color = {
    ok: 'text-white border-white/30 bg-white/[0.04]',
    warn: 'text-zinc-200 border-white/30 bg-white/[0.05]',
    err: 'text-crimson border-crimson/40 bg-crimson/10',
    info: 'text-zinc-300 border-white/20 bg-white/[0.03]',
  }[log.kind];

  return (
    <div className={cn('rounded-xl border p-3 text-xs font-mono leading-relaxed transition-all flex items-start gap-2', color)}>
      <span className="font-bold opacity-70 select-none">&gt;</span>
      <span className="break-words flex-1 min-w-0">{log.msg}</span>
    </div>
  );
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const { cyberNavigate } = useCyberTransition();
  const [value, setValue] = useState('');
  const [denied, setDenied] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    const isMatch = CONFIGURED_PASSWORD ? value === CONFIGURED_PASSWORD : trimmed.length > 0;
    if (isMatch) {
      onUnlock();
    } else {
      setDenied(true);
      setValue('');
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-black p-4">
      <form onSubmit={submit} className="glass relative z-10 w-full max-w-sm space-y-6 rounded-2xl p-6 sm:p-8 border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.9)]">
        <div className="space-y-2 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/[0.04] text-white shadow-sm mx-auto">
            <Lock size={18} />
          </div>
          <h1 className="text-sm font-bold tracking-widest text-white uppercase">
            RN // ADMIN GATEWAY
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Resistance Network intelligence terminal. Enter your operator passcode to unlock publishing and node controls.
          </p>
        </div>

        <Field
          label="Passcode"
          hint={
            !CONFIGURED_PASSWORD ? (
              <span className="text-[10px] text-zinc-500 font-mono">DEV MODE: ANY KEY</span>
            ) : undefined
          }
        >
          <input
            type="password"
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setDenied(false);
            }}
            className="tac-input py-3 text-center tracking-[0.25em] font-mono text-base"
            placeholder="••••••••••••"
          />
        </Field>

        {denied && (
          <div className="rounded-xl border border-crimson/40 bg-crimson/10 p-2.5 text-center text-xs font-semibold text-crimson">
            ACCESS DENIED — INVALID PASSCODE
          </div>
        )}

        <button type="submit" className="tac-btn tac-btn-active min-h-[46px] w-full text-xs font-bold rounded-xl">
          [ AUTHENTICATE &amp; UNLOCK ]
        </button>

        <button
          type="button"
          onClick={() => cyberNavigate('/', 'GLOBAL RESISTANCE NETWORK')}
          className="flex min-h-[44px] w-full items-center justify-center text-center text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          ← Return to Public Global Map
        </button>
      </form>
    </main>
  );
}

function Console({ onLock }: { onLock: () => void }) {
  const { cyberNavigate } = useCyberTransition();
  const { events, now } = useActiveEvents();
  const [tab, setTab] = useState<Tab>('overview');

  // AI Configuration State (Provider-agnostic API Configuration)
  const [aiConfig, setAiConfig] = useState<AiConfig>(getDefaultAiConfig);
  const [showAiKey, setShowAiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latencyMs: number; message: string } | null>(null);
  const [testingAi, setTestingAi] = useState(false);

  // Publisher State
  const [raw, setRaw] = useState('');
  const [draft, setDraft] = useState<EventDraft>(EMPTY);
  const [customTag, setCustomTag] = useState('');
  const [urlSanitized, setUrlSanitized] = useState(false);
  const [scrubbedFile, setScrubbedFile] = useState(false);
  const [busy, setBusy] = useState<'ai' | 'geo' | 'img' | 'pub' | 'purgeAll' | null>(null);
  const [log, setLog] = useState<Log>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Dispatch Management Search/Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Update AI Config and persist
  const updateAiConfig = (updates: Partial<AiConfig>) => {
    const next = { ...aiConfig, ...updates };
    setAiConfig(next);
    saveAiConfig(next);
  };

  const applyPreset = (preset: (typeof AI_PRESETS)[number]) => {
    const next = { ...aiConfig, ...preset.config };
    setAiConfig(next);
    saveAiConfig(next);
    setTestResult(null);
  };

  const runAiTest = async () => {
    setTestingAi(true);
    setTestResult(null);
    try {
      const res = await testAiConnection({
        apiKey: aiConfig.apiKey,
        baseUrl: aiConfig.baseUrl,
        model: aiConfig.model,
        provider: aiConfig.provider,
      });
      setTestResult(res);
    } finally {
      setTestingAi(false);
    }
  };

  // Publisher actions
  const setDraftField = <K extends keyof EventDraft>(k: K, v: EventDraft[K]) =>
    setDraft((d) => {
      const next = { ...d, [k]: v };
      if (k === 'tags' && Array.isArray(v)) {
        next.category = tagsToCategory(v as string[]);
      }
      return next;
    });

  const applySourceUrl = (value: string) => {
    const { url, changed } = sanitizeUrl(value);
    setDraftField('sourceUrl', url);
    setUrlSanitized(!!url || changed);
  };

  const toggleTag = (tag: string) => {
    const current = draft.tags ?? [];
    const exists = current.some((t) => t.toLowerCase() === tag.toLowerCase());
    const next = exists
      ? current.filter((t) => t.toLowerCase() !== tag.toLowerCase())
      : [...current, tag];
    setDraftField('tags', next);
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;
    const current = draft.tags ?? [];
    if (!current.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setDraftField('tags', [...current, trimmed]);
    }
    setCustomTag('');
  };

  const onTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCustomTag();
    }
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setRaw(text);
      else setLog({ kind: 'warn', msg: 'CLIPBOARD EMPTY' });
    } catch {
      setLog({ kind: 'warn', msg: 'CLIPBOARD ACCESS DENIED — PASTE DIRECTLY INTO TEXTAREA' });
    }
  };

  // Modular provider-agnostic dispatch extraction
  const processAi = async () => {
    if (!raw.trim()) return;
    setBusy('ai');
    setLog({ kind: 'info', msg: `Querying LLM at ${aiConfig.baseUrl || 'endpoint'} (${aiConfig.model})…` });
    try {
      const res = await extractDispatchWithAi(raw, {
        apiKey: aiConfig.apiKey,
        baseUrl: aiConfig.baseUrl,
        model: aiConfig.model,
        provider: aiConfig.provider,
      });
      setDraft((prev) => ({
        ...res.draft,
        sourceUrl: res.draft.sourceUrl ?? prev.sourceUrl ?? '',
        mediaUrl: prev.mediaUrl ?? '',
      }));
      if (res.draft.sourceUrl) applySourceUrl(res.draft.sourceUrl);
      else setUrlSanitized(false);

      if (res.source === 'ai') {
        setLog({ kind: 'ok', msg: `Extraction complete via ${res.providerName || aiConfig.model}. Verify details below.` });
      } else {
        setLog({ kind: 'warn', msg: `AI Gateway error (${res.error}). Fallback heuristic extracted draft.` });
      }
    } finally {
      setBusy(null);
    }
  };

  const lookupGeo = async () => {
    if (!draft.locationName.trim()) return;
    setBusy('geo');
    try {
      const hit = await geocode(draft.locationName);
      if (hit) {
        setDraft((d) => ({ ...d, lat: +hit.lat.toFixed(4), lng: +hit.lng.toFixed(4) }));
        setLog({ kind: 'ok', msg: `Geocoded: ${hit.name}` });
      } else {
        setLog({ kind: 'warn', msg: 'No geocoding match found for location' });
      }
    } catch (e) {
      setLog({ kind: 'err', msg: `Geocoder failed: ${(e as Error).message}` });
    } finally {
      setBusy(null);
    }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy('img');
    try {
      const dataUrl = await scrubImage(file);
      setDraftField('mediaUrl', dataUrl);
      setScrubbedFile(true);
      setLog({ kind: 'ok', msg: 'Image scrubbed: all EXIF, GPS, and metadata wiped.' });
    } catch (e) {
      setLog({ kind: 'err', msg: `Image rejected: ${(e as Error).message}` });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
      setBusy(null);
    }
  };

  const valid =
    draft.title.trim().length > 0 &&
    draft.summary.trim().length > 0 &&
    Number.isFinite(draft.lat) &&
    Number.isFinite(draft.lng) &&
    Math.abs(draft.lat) <= 90 &&
    Math.abs(draft.lng) <= 180;

  const publish = async () => {
    if (!valid) return;
    setBusy('pub');
    try {
      const finalTags = draft.tags.length > 0 ? draft.tags : ['Protest'];
      await publishEvent({
        ...draft,
        tags: finalTags,
        category: tagsToCategory(finalTags),
        mediaUrl: draft.mediaUrl?.trim() || undefined,
      });
      setLog({ kind: 'ok', msg: 'Dispatch published to RN // Global live feed ✓' });
      setDraft(EMPTY);
      setRaw('');
      setCustomTag('');
      setUrlSanitized(false);
      setScrubbedFile(false);
    } catch (e) {
      setLog({ kind: 'err', msg: `Publish failed: ${(e as Error).message}` });
    } finally {
      setBusy(null);
    }
  };

  const purgeAll = async () => {
    if (events.length === 0) return;
    if (!window.confirm(`Permanently purge all ${events.length} active dispatches from Firestore?`)) return;
    setBusy('purgeAll');
    try {
      for (const e of events) {
        if (e.id) {
          await purgeEvent(e.id);
        }
      }
      setLog({ kind: 'ok', msg: `Successfully purged all ${events.length} dispatches from network.` });
    } catch (e) {
      setLog({ kind: 'err', msg: `Purge all failed: ${(e as Error).message}` });
    } finally {
      setBusy(null);
    }
  };

  const purge = async (id?: string) => {
    if (!id) return;
    try {
      await purgeEvent(id);
    } catch (e) {
      setLog({ kind: 'err', msg: `Purge failed: ${(e as Error).message}` });
    }
  };

  const copyDispatchItem = async (e: OsintEvent) => {
    const text = dispatchText(e);
    if (await copyText(text)) {
      setCopiedId(e.id || null);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const exportDispatchesJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `rn-dispatches-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Metrics computation for Firestore Site Stats & System Overview
  const metrics = useMemo(() => {
    const total = events.length;
    const alertCount = events.filter((e) => getEventTags(e).some(isAlertTag) || e.category === 'strike').length;
    const uniqueLocations = new Set(events.map((e) => e.locationName.trim().toLowerCase())).size;

    const tagMap = new Map<string, number>();
    for (const e of events) {
      for (const t of getEventTags(e)) {
        tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
      }
    }
    const totalTagsInUse = tagMap.size;
    const sortedTags = Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);

    // Most recent event timestamp in Firestore
    const latestTimestamp = events.reduce((max, e) => Math.max(max, e.createdAt || 0), 0);

    // Compute regional buckets based on coordinates / names
    const regions: Record<string, number> = {
      'Middle East & Levant': 0,
      'Eastern Europe & Black Sea': 0,
      'East & SE Asia': 0,
      'Latin America': 0,
      'Africa & Sahel': 0,
      'Other Global Coordinates': 0,
    };

    for (const e of events) {
      const lat = e.lat;
      const lng = e.lng;
      if (lat >= 12 && lat <= 42 && lng >= 30 && lng <= 65) {
        regions['Middle East & Levant']++;
      } else if (lat >= 44 && lat <= 65 && lng >= 20 && lng <= 45) {
        regions['Eastern Europe & Black Sea']++;
      } else if (lat >= -10 && lat <= 50 && lng >= 95 && lng <= 145) {
        regions['East & SE Asia']++;
      } else if (lat >= -55 && lat <= 25 && lng >= -115 && lng <= -35) {
        regions['Latin America']++;
      } else if (lat >= -35 && lat <= 35 && lng >= -20 && lng <= 45) {
        regions['Africa & Sahel']++;
      } else {
        regions['Other Global Coordinates']++;
      }
    }

    // Velocity buckets (last 6h, 12h, 18h, 24h)
    const velocity = {
      h6: events.filter((e) => now - e.createdAt <= 6 * 3600_000).length,
      h12: events.filter((e) => now - e.createdAt > 6 * 3600_000 && now - e.createdAt <= 12 * 3600_000).length,
      h18: events.filter((e) => now - e.createdAt > 12 * 3600_000 && now - e.createdAt <= 18 * 3600_000).length,
      h24: events.filter((e) => now - e.createdAt > 18 * 3600_000).length,
    };

    return { total, alertCount, uniqueLocations, totalTagsInUse, sortedTags, latestTimestamp, regions, velocity };
  }, [events, now]);

  // Filtered dispatches in Management view
  const filteredDispatches = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        !searchQuery.trim() ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.locationName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !filterTag || getEventTags(e).includes(filterTag);
      return matchesSearch && matchesTag;
    });
  }, [events, searchQuery, filterTag]);

  return (
    <div className="min-h-screen w-full bg-black text-zinc-100 flex flex-col pb-24">
      {/* Top Bittensor Header (Clean single-row on mobile and desktop) */}
      <header className="glass sticky top-0 z-30 border-x-0 border-t-0 px-3.5 sm:px-6 py-2.5 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse shrink-0" />
              <h1 className="truncate text-xs sm:text-sm font-bold tracking-widest text-white uppercase">
                RN // ADMIN
              </h1>
              <span className="text-[9px] sm:text-[10px] text-zinc-400 font-mono border border-white/10 px-1.5 py-0.5 rounded shrink-0">
                TAO NODE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
              <span className="text-zinc-200">{aiConfig.provider === 'gemini' ? 'Gemini' : 'Universal LLM'}</span> · <span className="font-mono text-zinc-300">{aiConfig.model}</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => cyberNavigate('/', 'GLOBAL RESISTANCE NETWORK')}
              className="tac-btn min-h-[38px] px-2.5 sm:px-3 text-xs rounded-xl"
              title="Return to Public Globe"
            >
              <Globe2 size={14} className="text-white" />
              <span className="hidden sm:inline">Globe</span>
            </button>
            <button
              onClick={onLock}
              className="tac-btn min-h-[38px] px-2.5 sm:px-3 text-xs rounded-xl border-white/20 hover:border-white"
              title="Lock Admin Panel"
            >
              <Lock size={14} />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable iOS Segmented Tab Bar (Sleek single row, zero wrap) */}
        <div className="mx-auto mt-2 max-w-5xl">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 bg-white/[0.04] rounded-xl border border-white/10">
            {(
              [
                ['overview', <Activity key="1" size={13} />, 'System Overview'],
                ['publisher', <Bot key="2" size={13} />, 'AI Newsroom'],
                ['dispatches', <Layers key="3" size={13} />, `Feed (${events.length})`],
                ['settings', <Cpu key="4" size={13} />, 'API Configuration'],
              ] as const
            ).map(([key, icon, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium tracking-wide transition-all select-none px-3 py-1.5 whitespace-nowrap shrink-0 sm:flex-1',
                  tab === key
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]',
                )}
              >
                <span className="shrink-0">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 space-y-6 flex-1">
        {/* TAB 1: SYSTEM OVERVIEW & DASHBOARD */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* System Overview section pulling real site stats from Firestore */}
            <section className="glass rounded-2xl p-4 sm:p-5 border border-white/10 space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-white shrink-0" />
                  <h2 className="hud-label text-white">System Overview</h2>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse shrink-0" />
                  LIVE FIRESTORE METRICS
                </span>
              </div>

              {/* Clean glass-morphic grid layout for Firestore site stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. Total Events */}
                <div className="glass-card p-4 rounded-xl border border-white/10 space-y-1 min-w-0">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="font-medium uppercase tracking-wider truncate">Total Events</span>
                    <Radio size={14} className="text-white shrink-0 ml-1" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                    {metrics.total}
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono truncate">
                    {metrics.alertCount} High-Alert · 24h Window
                  </p>
                </div>

                {/* 2. Total Tags in Use */}
                <div className="glass-card p-4 rounded-xl border border-white/10 space-y-1 min-w-0">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="font-medium uppercase tracking-wider truncate">Total Tags in Use</span>
                    <Tag size={14} className="text-white shrink-0 ml-1" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                    {metrics.totalTagsInUse}
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono truncate">
                    Top: {metrics.sortedTags[0]?.[0] || 'None'} ({metrics.sortedTags[0]?.[1] || 0})
                  </p>
                </div>

                {/* 3. Last Update Timestamp */}
                <div className="glass-card p-4 rounded-xl border border-white/10 space-y-1 min-w-0">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="font-medium uppercase tracking-wider truncate">Last Update Timestamp</span>
                    <Clock size={14} className="text-white shrink-0 ml-1" />
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white font-mono truncate pt-1">
                    {metrics.latestTimestamp > 0 ? formatUtc(new Date(metrics.latestTimestamp)) : 'NO EVENTS RECORDED'}
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono truncate">
                    {metrics.latestTimestamp > 0 ? formatAgo(metrics.latestTimestamp, now) : 'Awaiting publication'}
                  </p>
                </div>
              </div>
            </section>

            {/* Regional Hotspots & Tag Distribution Grids */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Section title="GEOGRAPHIC HOTSPOT RADAR">
                <div className="space-y-3">
                  {Object.entries(metrics.regions).map(([region, count]) => {
                    const pct = metrics.total ? Math.round((count / metrics.total) * 100) : 0;
                    return (
                      <div key={region} className="space-y-1 min-w-0">
                        <div className="flex items-center justify-between text-xs text-zinc-300">
                          <span className="truncate pr-2">{region}</span>
                          <span className="tabular-nums font-mono text-white shrink-0">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-white transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              <Section title="ACTIVE TAG DISTRIBUTION">
                <div className="space-y-3">
                  {metrics.sortedTags.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-6">No tags recorded in active dataset.</p>
                  ) : (
                    metrics.sortedTags.slice(0, 6).map(([tag, count]) => {
                      const pct = metrics.total ? Math.round((count / metrics.total) * 100) : 0;
                      const isAlert = isAlertTag(tag);
                      return (
                        <div key={tag} className="space-y-1 min-w-0">
                          <div className="flex items-center justify-between text-xs">
                            <span className={cn('truncate pr-2 font-medium', isAlert ? 'text-crimson' : 'text-zinc-200')}>
                              {tag}
                            </span>
                            <span className="tabular-nums font-mono text-zinc-400 shrink-0">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                isAlert ? 'bg-crimson' : 'bg-white',
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Section>
            </div>

            {/* 24-Hour Timeline Velocity & Quick Tools */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Section title="24-HOUR DISPATCH TIMELINE VELOCITY">
                  <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                    {(
                      [
                        ['0 - 6H', metrics.velocity.h6],
                        ['6 - 12H', metrics.velocity.h12],
                        ['12 - 18H', metrics.velocity.h18],
                        ['18 - 24H', metrics.velocity.h24],
                      ] as const
                    ).map(([label, count]) => (
                      <div key={label} className="glass-card p-3 space-y-1 border-white/10 rounded-xl min-w-0">
                        <div className="text-[10px] text-zinc-400 font-mono truncate">{label}</div>
                        <div className="text-xl font-bold text-white tabular-nums">{count}</div>
                        <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white rounded-full"
                            style={{
                              width: `${metrics.total ? Math.min(100, (count / metrics.total) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              <div>
                <Section title="DATA UTILITIES &amp; OPS">
                  <div className="space-y-2.5">
                    <button
                      onClick={exportDispatchesJson}
                      className="tac-btn w-full justify-between rounded-xl min-h-[44px]"
                    >
                      <span className="flex items-center gap-2 text-xs truncate">
                        <Download size={14} className="text-white shrink-0" />
                        <span className="truncate">Export JSON Dataset</span>
                      </span>
                      <ChevronRight size={14} className="text-zinc-500 shrink-0" />
                    </button>

                    <button
                      onClick={purgeAll}
                      disabled={busy === 'purgeAll' || events.length === 0}
                      className="tac-btn w-full justify-between rounded-xl min-h-[44px] hover:border-crimson/50 hover:text-crimson"
                      title="Purge all active dispatches from Firestore"
                    >
                      <span className="flex items-center gap-2 text-xs truncate">
                        {busy === 'purgeAll' ? (
                          <Loader2 size={14} className="animate-spin text-crimson shrink-0" />
                        ) : (
                          <Trash2 size={14} className="text-zinc-400 group-hover:text-crimson shrink-0" />
                        )}
                        <span className="truncate">Purge All Active Dispatches</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">({events.length})</span>
                    </button>

                    <button
                      onClick={() => setTab('publisher')}
                      className="tac-btn tac-btn-active w-full justify-between rounded-xl min-h-[44px]"
                    >
                      <span className="flex items-center gap-2 text-xs truncate">
                        <Sparkles size={14} className="shrink-0" />
                        <span className="truncate">Create Dispatch</span>
                      </span>
                      <ChevronRight size={14} className="shrink-0" />
                    </button>
                  </div>
                </Section>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI NEWSROOM & PUBLISHER */}
        {tab === 'publisher' && (
          <div className="space-y-6">
            {/* A. AI Assistant Extraction Module */}
            <Section
              title="01. AI DISPATCH INGESTION"
              right={
                <span className="text-[10px] font-mono text-zinc-300 border border-white/20 bg-white/[0.04] px-2 py-0.5 rounded-md truncate max-w-[180px]">
                  ENDPOINT: {aiConfig.model}
                </span>
              }
            >
              <Field
                label="[ PASTE RAW ARTICLE / TELEGRAM POST ]"
                hint={<span className="text-[10px] text-zinc-400 font-mono">{raw.length} chars</span>}
              >
                <textarea
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  rows={6}
                  placeholder="Paste raw news wire, intelligence report, or Telegram post in any language…"
                  className="tac-input resize-y text-xs leading-relaxed font-mono"
                  dir="auto"
                />
              </Field>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <button type="button" onClick={paste} className="tac-btn min-h-[44px] rounded-xl">
                  <ClipboardPaste size={14} className="text-white shrink-0" />
                  <span className="truncate">Paste Clipboard</span>
                </button>
                <button
                  type="button"
                  onClick={processAi}
                  disabled={!raw.trim() || busy === 'ai'}
                  className="tac-btn tac-btn-active min-h-[44px] sm:col-span-2 rounded-xl text-xs font-semibold"
                >
                  {busy === 'ai' ? <Loader2 size={15} className="animate-spin shrink-0" /> : <Bot size={15} className="shrink-0" />}
                  <span className="truncate">[ EXTRACT &amp; SUMMARIZE (AI) ]</span>
                </button>
              </div>

              <StatusLine log={log} />
            </Section>

            {/* B. Manual Override & News Dispatch Form */}
            <Section title="02. MANUAL OVERRIDE &amp; DISPATCH EDITOR">
              <Field
                label="Headline"
                hint={
                  <span className={cn('tabular-nums font-mono text-[10px]', draft.title.length > 60 ? 'text-crimson' : 'text-zinc-400')}>
                    {draft.title.length}/60
                  </span>
                }
              >
                <input
                  type="text"
                  value={draft.title}
                  maxLength={60}
                  onChange={(e) => setDraftField('title', e.target.value)}
                  placeholder="Concise objective news headline…"
                  className="tac-input min-h-[44px]"
                />
              </Field>

              <Field label="Summary (2–3 Objective Sentences)">
                <textarea
                  value={draft.summary}
                  rows={3}
                  onChange={(e) => setDraftField('summary', e.target.value)}
                  placeholder="Concise objective summary of the dispatch event…"
                  className="tac-input resize-y text-xs leading-relaxed"
                />
              </Field>

              <Field label="Location Name (City, Country)">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draft.locationName}
                    onChange={(e) => setDraftField('locationName', e.target.value)}
                    placeholder="e.g. Beirut, Lebanon"
                    className="tac-input min-h-[44px] flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={lookupGeo}
                    disabled={busy === 'geo' || !draft.locationName.trim()}
                    className="tac-btn min-h-[44px] shrink-0 rounded-xl px-4"
                    title="Resolve latitude/longitude via OpenStreetMap Nominatim"
                  >
                    {busy === 'geo' ? <Loader2 size={14} className="animate-spin text-white shrink-0" /> : <MapPin size={14} className="text-white shrink-0" />}
                    <span className="hidden sm:inline">Geocode</span>
                  </button>
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Latitude (-90 to 90)">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={Number.isNaN(draft.lat) ? '' : draft.lat}
                    onChange={(e) => setDraftField('lat', e.target.value === '' ? 0 : Number(e.target.value))}
                    className="tac-input min-h-[44px] tabular-nums font-mono"
                  />
                </Field>
                <Field label="Longitude (-180 to 180)">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={Number.isNaN(draft.lng) ? '' : draft.lng}
                    onChange={(e) => setDraftField('lng', e.target.value === '' ? 0 : Number(e.target.value))}
                    className="tac-input min-h-[44px] tabular-nums font-mono"
                  />
                </Field>
              </div>

              {/* Dynamic Filter Tags Manager */}
              <div className="space-y-2.5">
                <span className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-medium uppercase tracking-wider text-zinc-300">
                  <span>Filter Tags (Base &amp; Dynamic Tags)</span>
                  <span className="tabular-nums font-mono text-[10px] text-zinc-400">{draft.tags.length} Active</span>
                </span>

                {/* Base Tags Selector */}
                <div className="flex flex-wrap gap-1.5">
                  {BASE_TAGS.map((tag) => {
                    const active = draft.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
                    const alert = isAlertTag(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          'min-h-[40px] rounded-xl border px-3 text-[10px] font-medium uppercase tracking-wider transition-all',
                          active
                            ? alert
                              ? 'border-crimson bg-crimson text-white font-bold'
                              : 'border-white bg-white text-black font-bold'
                            : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white hover:border-white/30',
                        )}
                      >
                        {active ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>

                {/* Active Tag Chips */}
                {draft.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 p-2.5">
                    {draft.tags.map((tag) => {
                      const alert = isAlertTag(tag);
                      return (
                        <span
                          key={tag}
                          className={cn(
                            'inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider',
                            alert
                              ? 'border-crimson/50 bg-crimson/15 text-crimson'
                              : 'border-white/20 bg-white/[0.06] text-white',
                          )}
                        >
                          <span className="truncate max-w-[140px]">{tag}</span>
                          <button
                            type="button"
                            onClick={() => toggleTag(tag)}
                            aria-label={`Remove tag ${tag}`}
                            className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-white/10"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Add Custom Tag Field */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={onTagKeyDown}
                    placeholder="Type custom tag (e.g. Sanctions, Election) &amp; press Enter…"
                    className="tac-input min-h-[44px] text-xs font-mono flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    disabled={!customTag.trim()}
                    className="tac-btn min-h-[44px] shrink-0 rounded-xl px-4"
                  >
                    <Plus size={14} className="text-white shrink-0" />
                    <span className="hidden sm:inline">Add Tag</span>
                  </button>
                </div>
              </div>

              <Field
                label="External Link / Source URL"
                hint={
                  urlSanitized && draft.sourceUrl ? (
                    <span className="badge-ok">
                      <Check size={10} /> Trackers Stripped
                    </span>
                  ) : undefined
                }
              >
                <input
                  type="url"
                  inputMode="url"
                  value={draft.sourceUrl ?? ''}
                  onChange={(e) => {
                    setDraftField('sourceUrl', e.target.value);
                    setUrlSanitized(false);
                  }}
                  onBlur={(e) => applySourceUrl(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    applySourceUrl(e.clipboardData.getData('text'));
                  }}
                  placeholder="https://…"
                  className="tac-input min-h-[44px] text-xs font-mono"
                />
              </Field>

              <Field
                label="Media / Image URL"
                hint={
                  scrubbedFile && draft.mediaUrl ? (
                    <span className="badge-ok">
                      <ShieldCheck size={10} /> EXIF &amp; GPS Scrubbed
                    </span>
                  ) : undefined
                }
              >
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      inputMode="url"
                      value={draft.mediaUrl?.startsWith('data:image/') ? '' : (draft.mediaUrl ?? '')}
                      onChange={(e) => {
                        setDraftField('mediaUrl', e.target.value);
                        setScrubbedFile(false);
                      }}
                      placeholder={
                        draft.mediaUrl?.startsWith('data:image/')
                          ? '[Scrubbed image attached below]'
                          : 'https://example.com/photo.jpg (or attach & scrub file)'
                      }
                      className="tac-input min-h-[44px] text-xs font-mono flex-1 min-w-0"
                    />
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onFile(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={busy === 'img'}
                      className="tac-btn min-h-[44px] shrink-0 rounded-xl px-4"
                      title="Upload and scrub image via Canvas"
                    >
                      {busy === 'img' ? <Loader2 size={14} className="animate-spin text-white shrink-0" /> : <ImagePlus size={14} className="text-white shrink-0" />}
                      <span className="hidden sm:inline">Scrub File</span>
                    </button>
                  </div>
                  {draft.mediaUrl && (
                    <div className="relative">
                      <img
                        src={draft.mediaUrl}
                        alt="Dispatch preview"
                        referrerPolicy="no-referrer"
                        className="max-h-56 w-full rounded-xl border border-white/10 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDraftField('mediaUrl', '');
                          setScrubbedFile(false);
                        }}
                        aria-label="Remove media"
                        className="absolute right-2 top-2 inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl border border-crimson/40 bg-black/80 text-crimson hover:bg-black"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </Field>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] font-mono text-zinc-400 flex flex-wrap items-center justify-between gap-2">
                <span className="truncate">COORDS: {formatCoords(draft.lat || 0, draft.lng || 0)}</span>
                <span className="text-white truncate">TAGS: {(draft.tags.length ? draft.tags : ['Protest']).join(', ')}</span>
              </div>

              <button
                type="button"
                onClick={publish}
                disabled={!valid || busy === 'pub'}
                className="tac-btn tac-btn-active min-h-[48px] w-full text-xs font-semibold rounded-xl"
              >
                {busy === 'pub' ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Send size={16} className="shrink-0" />}
                <span className="truncate">[ PUBLISH DISPATCH TO GLOBAL MAP ]</span>
              </button>
            </Section>
          </div>
        )}

        {/* TAB 3: DISPATCH MANAGEMENT FEED */}
        {tab === 'dispatches' && (
          <div className="space-y-4">
            <Section
              title={`ACTIVE DISPATCHES (${filteredDispatches.length}/${events.length})`}
              right={
                <button onClick={exportDispatchesJson} className="tac-btn min-h-[36px] text-xs rounded-xl px-3">
                  <Download size={13} className="text-white shrink-0" />
                  <span className="truncate">Export JSON</span>
                </button>
              }
            >
              {/* Search & Tag Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, location, or summary…"
                    className="tac-input pl-9 min-h-[44px] text-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {metrics.sortedTags.length > 0 && (
                  <select
                    value={filterTag ?? ''}
                    onChange={(e) => setFilterTag(e.target.value || null)}
                    className="tac-input sm:w-48 min-h-[44px] text-xs font-mono"
                  >
                    <option value="">All Tags ({metrics.sortedTags.length})</option>
                    {metrics.sortedTags.map(([tag, count]) => (
                      <option key={tag} value={tag}>
                        {tag} ({count})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {filteredDispatches.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-xs text-zinc-400">No dispatches found in the active network feed.</p>
                  <button onClick={() => setTab('publisher')} className="tac-btn rounded-xl">
                    <Sparkles size={14} /> Compose with AI Newsroom
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.08] space-y-1">
                  {filteredDispatches.map((e) => (
                    <div key={e.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CategoryBadge category={e.category} tags={e.tags} />
                          <span className="text-[10px] text-zinc-400 tabular-nums font-mono">
                            {formatAgo(e.createdAt, now)}
                          </span>
                          {e.sourceUrl && (
                            <a
                              href={e.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-zinc-300 hover:text-white flex items-center gap-0.5"
                            >
                              Source <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-white leading-snug break-words">{e.title}</h4>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{e.summary}</p>
                        <div className="text-[10px] font-mono text-zinc-300 flex items-center gap-2 truncate">
                          <MapPin size={11} className="shrink-0" />
                          <span className="truncate">{e.locationName} · {formatCoords(e.lat, e.lng)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => copyDispatchItem(e)}
                          className="tac-btn min-h-[38px] px-3 text-xs rounded-xl"
                          title="Copy standardized dispatch text"
                        >
                          {copiedId === e.id ? <Check size={13} className="text-white" /> : <ClipboardPaste size={13} />}
                          <span className="text-[11px]">{copiedId === e.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => purge(e.id)}
                          className="tac-btn tac-btn-danger min-h-[38px] px-3 text-xs rounded-xl"
                          title="Purge dispatch from Firestore"
                        >
                          <Trash2 size={13} />
                          <span className="text-[11px]">Purge</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}

        {/* TAB 4: API CONFIGURATION (Provider-Agnostic LLM Swap) */}
        {tab === 'settings' && (
          <div className="space-y-6">
            <Section
              title="API CONFIGURATION // LLM PROVIDERS"
              right={
                <span className="text-[10px] font-mono text-zinc-400 border border-white/10 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                  {aiConfig.apiKey ? 'KEY CONFIGURED' : 'NO KEY SET'}
                </span>
              }
            >
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect any LLM provider by configuring the API Key and Base URL below. Swap between OpenAI, OpenRouter, Groq, local Ollama, custom Bittensor subnets, or Google Gemini.
              </p>

              {/* Quick Presets Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">
                  Quick Provider Presets
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AI_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left text-xs transition-all duration-150',
                        aiConfig.model === preset.config.model && aiConfig.provider === preset.config.provider
                          ? 'border-white bg-white text-black font-semibold'
                          : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20',
                      )}
                    >
                      <div className="font-semibold text-[11px] truncate">{preset.name}</div>
                      <div className={cn('text-[9px] font-mono truncate', aiConfig.model === preset.config.model && aiConfig.provider === preset.config.provider ? 'text-zinc-700' : 'text-zinc-500')}>
                        {preset.config.model}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Architecture Selector */}
              <Field label="LLM Architecture / Protocol">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateAiConfig({ provider: 'openai_compatible' })}
                    className={cn(
                      'tac-btn min-h-[44px] rounded-xl text-xs font-medium justify-start px-3',
                      aiConfig.provider === 'openai_compatible' && 'tac-btn-active',
                    )}
                  >
                    <Server size={14} className="shrink-0" />
                    <span className="truncate">OpenAI-Compatible (OpenAI, Groq, Ollama, Bittensor)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAiConfig({ provider: 'gemini' })}
                    className={cn(
                      'tac-btn min-h-[44px] rounded-xl text-xs font-medium justify-start px-3',
                      aiConfig.provider === 'gemini' && 'tac-btn-active',
                    )}
                  >
                    <Sparkles size={14} className="shrink-0" />
                    <span className="truncate">Google Gemini (Flash 2.5)</span>
                  </button>
                </div>
              </Field>

              {/* API Key Field */}
              <Field
                label="API Key"
                hint={
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {aiConfig.apiKey ? '✓ Key Saved in Storage' : 'Required for AI ingestion'}
                  </span>
                }
              >
                <div className="relative">
                  <input
                    type={showAiKey ? 'text' : 'password'}
                    value={aiConfig.apiKey}
                    onChange={(e) => updateAiConfig({ apiKey: e.target.value })}
                    placeholder="Paste API Key (sk-..., gsk_..., or AIza...)"
                    autoComplete="off"
                    spellCheck={false}
                    className="tac-input min-h-[44px] pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAiKey(!showAiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showAiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>

              {/* Base URL (Required for provider agnosticism) */}
              <Field
                label="Base URL"
                hint={<span className="text-[10px] text-zinc-400 font-mono">e.g. https://api.openai.com/v1</span>}
              >
                <input
                  type="text"
                  value={aiConfig.baseUrl}
                  onChange={(e) => updateAiConfig({ baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="tac-input min-h-[44px] font-mono text-xs"
                />
              </Field>

              {/* Model ID */}
              <Field
                label="Target Model Identifier"
                hint={<span className="text-[10px] text-zinc-400 font-mono">Model payload string</span>}
              >
                <input
                  type="text"
                  value={aiConfig.model}
                  onChange={(e) => updateAiConfig({ model: e.target.value })}
                  placeholder="e.g. gpt-4o-mini, llama-3.3-70b-versatile, cortext-ultra"
                  className="tac-input min-h-[44px] font-mono text-xs"
                />
              </Field>

              {/* Test Connection Button & Result */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <button
                  type="button"
                  onClick={runAiTest}
                  disabled={testingAi}
                  className="tac-btn min-h-[44px] px-6 rounded-xl text-xs font-medium"
                >
                  {testingAi ? <Loader2 size={14} className="animate-spin text-white shrink-0" /> : <Wifi size={14} className="text-white shrink-0" />}
                  <span className="truncate">Test Connection &amp; Latency</span>
                </button>

                {testResult && (
                  <div
                    className={cn(
                      'rounded-xl border p-2.5 px-4 text-xs font-mono flex items-center gap-2 truncate',
                      testResult.ok ? 'border-white/40 bg-white/[0.06] text-white' : 'border-crimson/40 bg-crimson/10 text-crimson',
                    )}
                  >
                    {testResult.ok ? <CheckCircle2 size={14} className="shrink-0" /> : <X size={14} className="shrink-0" />}
                    <span className="truncate">{testResult.message}</span>
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OpsConsole() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_FLAG) === 'true');

  const unlock = () => {
    sessionStorage.setItem(SESSION_FLAG, 'true');
    setUnlocked(true);
  };
  const lock = () => {
    sessionStorage.removeItem(SESSION_FLAG);
    setUnlocked(false);
  };

  return unlocked ? <Console onLock={lock} /> : <Gate onUnlock={unlock} />;
}
