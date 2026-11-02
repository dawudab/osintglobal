import { useState } from 'react';
import {
  Check,
  Copy,
  Cpu,
  Eye,
  Heart,
  Lock,
  Radio,
  RotateCw,
  Settings,
  Shield,
  ShieldCheck,
  Terminal,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { cn } from '../utils/format';

export interface SiteSettings {
  soundEnabled: boolean;
  autoRotate: boolean;
  atmosphereGlow: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  settings: SiteSettings;
  onUpdateSettings: (updater: (prev: SiteSettings) => SiteSettings) => void;
  onAdminClick: () => void;
  initialTab?: 'settings' | 'fund' | 'manifesto';
}

const WALLETS = [
  {
    symbol: 'TAO',
    name: 'Bittensor Network',
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    memo: 'Decentralized Intelligence Subnet Fund',
  },
  {
    symbol: 'XMR',
    name: 'Monero (Anonymous)',
    address: '888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkFxbTNsFo5VNsg6ReUmU5422shBQJaWToeXSLRFJJaEQnGAbhdT45v7MgK',
    memo: 'Zero-Trace Private Relay',
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin (SegWit)',
    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    memo: 'Direct Node Infrastructure',
  },
];

export default function NetworkSettingsModal({
  open,
  onClose,
  settings,
  onUpdateSettings,
  onAdminClick,
  initialTab = 'settings',
}: Props) {
  const [activeTab, setActiveTab] = useState<'settings' | 'fund' | 'manifesto'>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!open) return null;

  const handleCopy = (symbol: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(symbol);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md font-mono select-none pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg my-auto max-h-[85vh] flex flex-col rounded-2xl border border-white/20 bg-zinc-950 p-4 sm:p-5 shadow-[0_0_60px_rgba(255,255,255,0.12)] text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white">
              GRN // SYSTEM CONTROL
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close window"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/[0.04] rounded-xl border border-white/10 my-3 shrink-0">
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              'flex items-center justify-center gap-1.5 py-2 px-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all',
              activeTab === 'settings'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5',
            )}
          >
            <Settings size={13} />
            <span className="truncate">Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('fund')}
            className={cn(
              'flex items-center justify-center gap-1.5 py-2 px-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all',
              activeTab === 'fund'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5',
            )}
          >
            <Heart size={13} />
            <span className="truncate">Fund</span>
          </button>

          <button
            onClick={() => setActiveTab('manifesto')}
            className={cn(
              'flex items-center justify-center gap-1.5 py-2 px-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all',
              activeTab === 'manifesto'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5',
            )}
          >
            <Radio size={13} />
            <span className="truncate">Protocol</span>
          </button>
        </div>

        {/* Tab 1: Site Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-3 py-1 overflow-y-auto flex-1 min-h-0 pr-1">
            {/* Audio Feedback */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  {settings.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  <span>SYNTH AUDIO CHIMES</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">Digital Web Audio chimes on transitions</p>
              </div>
              <button
                onClick={() => onUpdateSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
                className={cn(
                  'min-h-[36px] px-3 rounded-lg border text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all shrink-0 active:scale-95',
                  settings.soundEnabled
                    ? 'border-white bg-white text-black shadow-sm'
                    : 'border-white/20 bg-black text-zinc-400 hover:text-white',
                )}
              >
                {settings.soundEnabled ? 'ENABLED' : 'MUTED'}
              </button>
            </div>

            {/* Globe Drift / Auto-Rotate */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <RotateCw size={15} />
                  <span>GLOBE DRIFT / AUTO-ROTATE</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">Gentle planetary drift when idle</p>
              </div>
              <button
                onClick={() => onUpdateSettings((s) => ({ ...s, autoRotate: !s.autoRotate }))}
                className={cn(
                  'min-h-[36px] px-3 rounded-lg border text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all shrink-0 active:scale-95',
                  settings.autoRotate
                    ? 'border-white bg-white text-black shadow-sm'
                    : 'border-white/20 bg-black text-zinc-400 hover:text-white',
                )}
              >
                {settings.autoRotate ? 'ACTIVE' : 'STATIONARY'}
              </button>
            </div>

            {/* Atmosphere Luminescence */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Eye size={15} />
                  <span>ATMOSPHERE LUMINESCENCE</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">Ethereal planetary glow halo</p>
              </div>
              <button
                onClick={() => onUpdateSettings((s) => ({ ...s, atmosphereGlow: !s.atmosphereGlow }))}
                className={cn(
                  'min-h-[36px] px-3 rounded-lg border text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all shrink-0 active:scale-95',
                  settings.atmosphereGlow
                    ? 'border-white bg-white text-black shadow-sm'
                    : 'border-white/20 bg-black text-zinc-400 hover:text-white',
                )}
              >
                {settings.atmosphereGlow ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Resistance Fund */}
        {activeTab === 'fund' && (
          <div className="space-y-3 py-1 overflow-y-auto flex-1 min-h-0 pr-1">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-relaxed text-zinc-300">
              <p className="flex items-start gap-2">
                <ShieldCheck size={16} className="shrink-0 text-white mt-0.5" />
                <span>
                  The <strong className="text-white">GRN Network</strong> is 100% community-supported and tracker-free. Your contributions fund decentralized hosting, unthrottled bandwidth, and verified frontline relays.
                </span>
              </p>
            </div>

            <div className="space-y-2.5">
              {WALLETS.map((w) => {
                const isCopied = copiedKey === w.symbol;
                return (
                  <div
                    key={w.symbol}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white">
                          {w.symbol}
                        </span>
                        <span className="text-xs font-semibold text-zinc-300">{w.name}</span>
                      </div>
                      <span className="text-[9px] text-zinc-500 uppercase">{w.memo}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-lg bg-black/60 border border-white/10 px-2.5 sm:px-3 py-2 text-xs">
                      <span className="truncate font-mono text-[11px] text-zinc-300">{w.address}</span>
                      <button
                        onClick={() => handleCopy(w.symbol, w.address)}
                        className="shrink-0 rounded-md border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-all flex items-center gap-1 active:scale-95"
                      >
                        {isCopied ? (
                          <>
                            <Check size={12} className="text-white" />
                            <span>COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>COPY</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Manifesto / Protocol */}
        {activeTab === 'manifesto' && (
          <div className="space-y-3 py-1 overflow-y-auto flex-1 min-h-0 pr-1 text-xs">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                <span className="text-[9px] text-zinc-500 uppercase block">NODE PROTOCOL</span>
                <span className="text-white font-bold">BITTENSOR TAO SUBNET</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                <span className="text-[9px] text-zinc-500 uppercase block">OPSEC LEVEL</span>
                <span className="text-white font-bold">ZERO-KNOWLEDGE / NO LOGS</span>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-zinc-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <Terminal size={15} className="shrink-0 text-white mt-0.5" />
                <div>
                  <strong className="text-white uppercase text-[11px]">Decentralized Newsroom:</strong>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Traditional news feeds are vulnerable to geo-blocking and censorship. GRN distributes frontline dispatches across independent decentralized nodes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Shield size={15} className="shrink-0 text-white mt-0.5" />
                <div>
                  <strong className="text-white uppercase text-[11px]">Zero Tracking Guarantee:</strong>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    No analytics cookies, no fingerprinting scripts, no user telemetry. Media files undergo in-browser EXIF scrub before broadcast.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Cpu size={15} className="shrink-0 text-white mt-0.5" />
                <div>
                  <strong className="text-white uppercase text-[11px]">Autonomous Consensus:</strong>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Dispatches expire within 24 hours to ensure high signal-to-noise ratio and keep tracking real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer with Discreet Lock Sign for Admin Clearance */}
        <div className="border-t border-white/10 pt-3 mt-3 flex items-center justify-between text-[10px] text-zinc-500 shrink-0">
          <span className="tracking-widest uppercase text-[9px] font-mono">
            GRN // PROTOCOL v2.5
          </span>

          {/* Discreet Lock Sign for Operator Gate */}
          <button
            onClick={() => {
              onClose();
              onAdminClick();
            }}
            title="Encrypted Clearance Gate"
            aria-label="Security Clearance Gate"
            className="group flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-zinc-500 hover:border-white/30 hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            <Lock size={12} className="transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>
    </div>
  );
}
