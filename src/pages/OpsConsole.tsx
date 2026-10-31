import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { Link } from 'react-router-dom';
import {
  Bot, Check, ClipboardPaste, Database, Globe2, ImagePlus, KeyRound, Loader2, Lock, MapPin, Send, ShieldCheck, Trash2, X,
} from 'lucide-react';
import { auth } from '../services/firebase';
import { analyzeIntel, geocode, hasKeyOverride, setGeminiKeyOverride } from '../services/gemini';
import { publishEvent, purgeEvent, seedSampleEvents } from '../services/events';
import { useActiveEvents } from '../hooks';
import type { EventCategory, EventDraft } from '../types';
import { CATEGORIES, CATEGORY_KEYS, hexToRgba } from '../utils/categories';
import { cn, formatAgo, formatCoords } from '../utils/format';
import { sanitizeUrl, scrubImage } from '../utils/opsec';
import CategoryBadge from '../components/CategoryBadge';

const SESSION_FLAG = 'centcom.ops.unlocked';
// No hardcoded fallback: without a configured passphrase the console stays locked.
const rawPass: string = import.meta.env.VITE_OPERATOR_PASSPHRASE ?? '';
const PASSPHRASE = rawPass === 'change-me' ? '' : rawPass;

const EMPTY: EventDraft = { title: '', summary: '', locationName: '', lat: 0, lng: 0, category: 'general', sourceUrl: '' };

type Log = { kind: 'ok' | 'warn' | 'err' | 'info'; msg: string } | null;

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="glass space-y-3 rounded-lg p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="hud-label">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
        {hint}
      </span>
      {children}
    </label>
  );
}

function StatusLine({ log }: { log: Log }) {
  if (!log) return null;
  const color = { ok: 'text-emerald-400', warn: 'text-amber', err: 'text-red-400', info: 'text-radar' }[log.kind];
  return <p className={cn('break-words text-[11px] tracking-wide', color)}>&gt; {log.msg}</p>;
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [denied, setDenied] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (PASSPHRASE && value === PASSPHRASE) onUnlock();
    else {
      setDenied(true);
      setValue('');
    }
  };

  return (
    <main className="scanlines flex h-[100dvh] w-screen items-center justify-center bg-void p-5">
      <form onSubmit={submit} className="glass w-full max-w-sm space-y-5 rounded-lg p-6">
        <div className="space-y-1">
          <div className="hud-label flex items-center gap-2"><Lock size={12} /> // RESTRICTED TERMINAL</div>
          <p className="text-[11px] text-slate-500">AUTHORIZED OPERATORS ONLY. NO IDENTITY REQUIRED.</p>
        </div>
        <Field label="Operator Passphrase">
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
            className="tac-input tracking-widest"
            placeholder="••••••••••••"
          />
        </Field>
        {denied && <p className="text-[11px] font-bold tracking-widest text-red-400">&gt; ACCESS DENIED</p>}
        <button type="submit" className="tac-btn tac-btn-active w-full">[ AUTHENTICATE ]</button>
        <Link to="/" className="block text-center text-[10px] tracking-widest text-slate-600">← RETURN TO PUBLIC HUD</Link>
      </form>
    </main>
  );
}

function Console({ onLock }: { onLock: () => void }) {
  const { events, error: feedError, now } = useActiveEvents(false);
  const [raw, setRaw] = useState('');
  const [draft, setDraft] = useState<EventDraft>(EMPTY);
  const [media, setMedia] = useState<string>();
  const [urlSanitized, setUrlSanitized] = useState(false);
  const [busy, setBusy] = useState<'ai' | 'geo' | 'img' | 'pub' | 'seed' | null>(null);
  const [log, setLog] = useState<Log>(null);
  const [pinLog, setPinLog] = useState<Log>(null);
  const [authState, setAuthState] = useState('PENDING');
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyOverride, setKeyOverride] = useState(hasKeyOverride);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    signInAnonymously(auth)
      .then(() => setAuthState('ANON SESSION'))
      .catch(() => setAuthState('UNAUTHENTICATED'));
  }, []);

  const set = <K extends keyof EventDraft>(k: K, v: EventDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const applySourceUrl = (value: string) => {
    const { url, changed } = sanitizeUrl(value);
    set('sourceUrl', url);
    setUrlSanitized(!!url || changed);
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setRaw(text);
      else setLog({ kind: 'warn', msg: 'CLIPBOARD EMPTY' });
    } catch {
      setLog({ kind: 'warn', msg: 'CLIPBOARD ACCESS DENIED — LONG-PRESS THE FIELD TO PASTE MANUALLY' });
    }
  };

  const process = async () => {
    if (!raw.trim()) return;
    setBusy('ai');
    setLog({ kind: 'info', msg: 'CO-PILOT ANALYZING…' });
    const res = await analyzeIntel(raw);
    setDraft({ ...res.draft, sourceUrl: '' });
    if (res.draft.sourceUrl) applySourceUrl(res.draft.sourceUrl);
    else setUrlSanitized(false);
    setLog(
      res.source === 'ai'
        ? { kind: 'ok', msg: 'AI CO-PILOT ANALYSIS COMPLETE — VERIFY BEFORE PUBLISHING' }
        : { kind: 'warn', msg: `AI UNAVAILABLE (${res.error}) — HEURISTIC FALLBACK APPLIED, REVIEW MANUALLY` },
    );
    setBusy(null);
  };

  const lookup = async () => {
    if (!draft.locationName.trim()) return;
    setBusy('geo');
    try {
      const hit = await geocode(draft.locationName);
      if (hit) {
        setDraft((d) => ({ ...d, lat: +hit.lat.toFixed(4), lng: +hit.lng.toFixed(4) }));
        setLog({ kind: 'ok', msg: `GEOCODED: ${hit.name}` });
      } else setLog({ kind: 'warn', msg: 'NO GEOCODER MATCH' });
    } catch (e) {
      setLog({ kind: 'err', msg: `GEOCODER FAILED: ${(e as Error).message}` });
    }
    setBusy(null);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy('img');
    try {
      setMedia(await scrubImage(file));
    } catch (e) {
      setLog({ kind: 'err', msg: `IMAGE REJECTED: ${(e as Error).message}` });
    }
    if (fileRef.current) fileRef.current.value = '';
    setBusy(null);
  };

  const valid = draft.title.trim() && draft.summary.trim() && Number.isFinite(draft.lat) && Number.isFinite(draft.lng) && Math.abs(draft.lat) <= 90 && Math.abs(draft.lng) <= 180;

  const publish = async () => {
    if (!valid) return;
    setBusy('pub');
    try {
      await publishEvent({ ...draft, mediaUrl: media });
      setLog({ kind: 'ok', msg: 'PUBLISHED TO LIVE GLOBE ✓' });
      setDraft(EMPTY);
      setRaw('');
      setMedia(undefined);
      setUrlSanitized(false);
    } catch (e) {
      setLog({ kind: 'err', msg: `PUBLISH FAILED: ${(e as Error).message}` });
    }
    setBusy(null);
  };

  const seed = async () => {
    setBusy('seed');
    try {
      await seedSampleEvents();
      setPinLog({ kind: 'ok', msg: 'DEMO EVENTS SEEDED' });
    } catch (e) {
      setPinLog({ kind: 'err', msg: `SEED FAILED: ${(e as Error).message}` });
    }
    setBusy(null);
  };

  const purge = async (id?: string) => {
    if (!id) return;
    try {
      await purgeEvent(id);
    } catch (e) {
      setPinLog({ kind: 'err', msg: `PURGE FAILED: ${(e as Error).message}` });
    }
  };

  const saveKey = () => {
    setGeminiKeyOverride(keyInput);
    setKeyOverride(!!keyInput.trim());
    setKeyInput('');
    setShowKey(false);
  };

  return (
    <main className="scanlines h-[100dvh] w-screen overflow-y-auto overscroll-contain bg-void">
      <header className="glass sticky top-0 z-20 border-x-0 border-t-0 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-xs font-bold tracking-[0.18em] text-amber">OPS CONSOLE <span className="text-amber/50">//</span> CO-PILOT</h1>
            <p className="text-[9px] tracking-widest text-slate-500">AUTH: {authState} · {keyOverride ? 'KEY: SESSION OVERRIDE' : 'KEY: ENV'}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button onClick={() => setShowKey((s) => !s)} aria-label="Gemini API key" className={cn('tac-btn h-10 min-h-0 w-10 px-0', showKey && 'tac-btn-active')}>
              <KeyRound size={15} />
            </button>
            <Link to="/" aria-label="Public globe" className="tac-btn h-10 min-h-0 w-10 px-0"><Globe2 size={15} /></Link>
            <button onClick={onLock} aria-label="Lock console" className="tac-btn h-10 min-h-0 w-10 px-0"><Lock size={15} /></button>
          </div>
        </div>
        {showKey && (
          <div className="mx-auto mt-2 flex max-w-2xl gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste Gemini key (AIza…) — blank clears override"
              autoComplete="off"
              className="tac-input py-2 text-xs"
            />
            <button onClick={saveKey} className="tac-btn shrink-0">SET</button>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4 pb-[calc(env(safe-area-inset-bottom)+32px)]">
        <Section title="// 01 RAW INTEL INPUT">
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={6}
            placeholder="Paste Telegram / news text (EN · RU · AR · ES · PT)…"
            className="tac-input resize-y text-[13px] leading-relaxed"
            dir="auto"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button onClick={paste} className="tac-btn"><ClipboardPaste size={15} /> [ PASTE FROM CLIPBOARD ]</button>
            <button onClick={process} disabled={!raw.trim() || busy === 'ai'} className="tac-btn tac-btn-active">
              {busy === 'ai' ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />} [ PROCESS WITH AI CO-PILOT ]
            </button>
          </div>
          <StatusLine log={log} />
        </Section>

        <Section title="// 02 VERIFY & SANITIZE">
          <Field label="Title" hint={<span className={draft.title.length > 60 ? 'text-red-400' : ''}>{draft.title.length}/60</span>}>
            <input value={draft.title} maxLength={60} onChange={(e) => set('title', e.target.value)} className="tac-input" />
          </Field>
          <Field label="SITREP Summary">
            <textarea value={draft.summary} rows={3} onChange={(e) => set('summary', e.target.value)} className="tac-input resize-y text-[13px]" />
          </Field>
          <Field label="Category">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_KEYS.map((k: EventCategory) => {
                const { label, color } = CATEGORIES[k];
                const on = draft.category === k;
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={() => set('category', k)}
                    className="min-h-[40px] rounded border px-2.5 text-[10px] font-bold tracking-widest"
                    style={{ color: on ? color : '#64748b', borderColor: on ? color : '#1e293b', background: on ? hexToRgba(color, 0.12) : 'transparent' }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Location (City, Country)">
            <div className="flex gap-2">
              <input value={draft.locationName} onChange={(e) => set('locationName', e.target.value)} className="tac-input" />
              <button type="button" onClick={lookup} disabled={busy === 'geo' || !draft.locationName.trim()} className="tac-btn shrink-0" aria-label="Geocode">
                {busy === 'geo' ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
                <span className="hidden sm:inline">GEOCODE</span>
              </button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Latitude">
              <input type="number" inputMode="decimal" step="any" value={draft.lat} onChange={(e) => set('lat', e.target.valueAsNumber)} className="tac-input tabular-nums" />
            </Field>
            <Field label="Longitude">
              <input type="number" inputMode="decimal" step="any" value={draft.lng} onChange={(e) => set('lng', e.target.valueAsNumber)} className="tac-input tabular-nums" />
            </Field>
          </div>
          <Field label="Source URL" hint={urlSanitized && draft.sourceUrl ? <span className="badge-ok"><Check size={10} /> URL SANITIZED</span> : undefined}>
            <input
              type="url"
              inputMode="url"
              value={draft.sourceUrl ?? ''}
              onChange={(e) => {
                set('sourceUrl', e.target.value);
                setUrlSanitized(false);
              }}
              onBlur={(e) => applySourceUrl(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                applySourceUrl(e.clipboardData.getData('text'));
              }}
              placeholder="https://t.me/…"
              className="tac-input text-xs"
            />
          </Field>
          <Field label="Media (optional)" hint={media ? <span className="badge-ok"><ShieldCheck size={10} /> EXIF & GPS STRIPPED</span> : undefined}>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            {media ? (
              <div className="relative">
                <img src={media} alt="Scrubbed preview" className="max-h-56 w-full rounded border border-slate-800 object-cover" />
                <button type="button" onClick={() => setMedia(undefined)} aria-label="Remove image" className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded bg-black/70 text-red-400">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={busy === 'img'} className="tac-btn w-full border-dashed">
                {busy === 'img' ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />} [ ATTACH & SCRUB IMAGE ]
              </button>
            )}
          </Field>
          <div className="rounded border border-slate-800 bg-black/40 p-2.5 text-[10px] tracking-wider text-slate-500">
            PREVIEW: {formatCoords(draft.lat || 0, draft.lng || 0)} · TIMESTAMP FUZZED TO MINUTE · EXPIRES +24H · NO AUTHOR METADATA
          </div>
          <button onClick={publish} disabled={!valid || busy === 'pub'} className="tac-btn tac-btn-active min-h-[52px] w-full text-sm">
            {busy === 'pub' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} [ PUBLISH TO GLOBE ]
          </button>
        </Section>

        <Section
          title={`// 03 ACTIVE PINS (${events.length})`}
          right={
            <button onClick={seed} disabled={busy === 'seed'} className="tac-btn min-h-[36px] text-[10px]">
              {busy === 'seed' ? <Loader2 size={13} className="animate-spin" /> : <Database size={13} />} [ SEED DEMO DATA ]
            </button>
          }
        >
          <StatusLine log={pinLog ?? (feedError ? { kind: 'err', msg: `FIRESTORE: ${feedError}` } : null)} />
          {events.length === 0 ? (
            <p className="py-4 text-center text-[11px] tracking-widest text-slate-600">// NO ACTIVE PINS — SEED DEMO DATA TO TEST PIPELINE</p>
          ) : (
            <ul className="divide-y divide-slate-800/70">
              {events.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={e.category} />
                      <span className="text-[10px] text-radar/80">{formatAgo(e.createdAt, now)}</span>
                    </div>
                    <div className="truncate text-[12px] text-slate-200">{e.title}</div>
                    <div className="truncate text-[10px] text-amber/70">{e.locationName}</div>
                  </div>
                  <button onClick={() => purge(e.id)} className="tac-btn shrink-0 border-red-500/40 text-red-400">
                    <Trash2 size={14} /> PURGE
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </main>
  );
}

export default function OpsConsole() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_FLAG) === '1');

  const unlock = () => {
    sessionStorage.setItem(SESSION_FLAG, '1');
    setUnlocked(true);
  };
  const lock = () => {
    sessionStorage.removeItem(SESSION_FLAG);
    setGeminiKeyOverride('');
    auth.signOut().catch(() => {});
    setUnlocked(false);
  };

  return unlocked ? <Console onLock={lock} /> : <Gate onUnlock={unlock} />;
}
