/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe2, Radio, Lock } from 'lucide-react';

interface CyberTransitionContextType {
  isTransitioning: boolean;
  cyberNavigate: (to: string, targetLabel?: string) => void;
}

const CyberTransitionContext = createContext<CyberTransitionContextType>({
  isTransitioning: false,
  cyberNavigate: () => {},
});

export const useCyberTransition = () => useContext(CyberTransitionContext);

// Web Audio API synthesized cyberpunk audio effect (pure code, zero external files)
function playCyberChirp() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') ctx.resume();

    // 1. Sub-bass thump
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(140, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.18);
    gain1.gain.setValueAtTime(0.28, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.22);

    // 2. High-frequency digital cyber chirp
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(1800, ctx.currentTime + 0.04);
    osc2.frequency.setValueAtTime(3200, ctx.currentTime + 0.08);
    osc2.frequency.setValueAtTime(2400, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.06, ctx.currentTime + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.04);
    osc2.stop(ctx.currentTime + 0.2);
  } catch {
    // Audio context may be restricted in non-interactive contexts; ignore silently
  }
}

export function CyberTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'close' | 'hold' | 'open'>('idle');
  const [targetLabel, setTargetLabel] = useState('GLOBAL RESISTANCE NETWORK');
  const [hexHash, setHexHash] = useState('0x7F2A...9C14');
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number[]>([]);

  const clearAllTimers = () => {
    timerRef.current.forEach((id) => clearTimeout(id));
    timerRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  // Animate dynamic hex hash stream during transition
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      const chars = '0123456789ABCDEF';
      let h = '0x';
      for (let i = 0; i < 4; i++) h += chars[Math.floor(Math.random() * chars.length)];
      h += '...';
      for (let i = 0; i < 4; i++) h += chars[Math.floor(Math.random() * chars.length)];
      setHexHash(h);
    }, 45);
    return () => clearInterval(interval);
  }, [active]);

  const cyberNavigate = (to: string, label = 'TARGET MODULE') => {
    clearAllTimers();
    setTargetLabel(label);
    setActive(true);
    setPhase('close');
    setProgress(15);
    playCyberChirp();

    // Phase 1: Shutters slam shut (0 - 180ms)
    const t1 = window.setTimeout(() => {
      setPhase('hold');
      setProgress(65);
    }, 180);

    // Phase 2: Route switch & clearance verification (180 - 320ms)
    const t2 = window.setTimeout(() => {
      navigate(to);
      setProgress(100);
      setPhase('open');
    }, 320);

    // Phase 3: Shutters slide open and reveal target (320 - 580ms)
    const t3 = window.setTimeout(() => {
      setActive(false);
      setPhase('idle');
      setProgress(0);
    }, 580);

    timerRef.current.push(t1, t2, t3);
  };

  return (
    <CyberTransitionContext.Provider value={{ isTransitioning: active, cyberNavigate }}>
      {children}

      {/* Cyberpunk Full-Screen Transition Overlay */}
      {active && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden pointer-events-auto select-none font-mono"
        >
          {/* Top Cyber Shutter */}
          <div
            className={`absolute inset-x-0 top-0 h-1/2 bg-black border-b border-white/20 transition-transform duration-200 ease-out ${
              phase === 'close' || phase === 'hold' ? 'translate-y-0' : '-translate-y-full'
            }`}
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 100%, rgba(255,255,255,0.06), transparent 70%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '100% 100%, 24px 24px',
            }}
          >
            {/* Top edge HUD telemetry */}
            <div className="absolute top-4 inset-x-6 flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest">
              <span>// RESISTANCE_NETWORK.SHUTTER_TOP</span>
              <span className="tabular-nums">SUBNET_HASH: {hexHash}</span>
            </div>
          </div>

          {/* Bottom Cyber Shutter */}
          <div
            className={`absolute inset-x-0 bottom-0 h-1/2 bg-black border-t border-white/20 transition-transform duration-200 ease-out ${
              phase === 'close' || phase === 'hold' ? 'translate-y-0' : 'translate-y-full'
            }`}
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06), transparent 70%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '100% 100%, 24px 24px',
            }}
          >
            {/* Bottom edge HUD telemetry */}
            <div className="absolute bottom-4 inset-x-6 flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest">
              <span>STATUS: ZERO_KNOWLEDGE_PROOF_VERIFIED</span>
              <span>TAO_NODE_SECURE</span>
            </div>
          </div>

          {/* Center Seam Laser Beam */}
          <div
            className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-white transition-opacity duration-150 ${
              phase === 'hold' ? 'opacity-100 shadow-[0_0_24px_#ffffff]' : 'opacity-0'
            }`}
          />

          {/* Cyber CRT Horizontal Scanlines Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px)',
            }}
          />

          {/* Centered Holographic HUD Card */}
          <div
            className={`relative z-10 mx-4 max-w-md w-full rounded-2xl border border-white/20 bg-zinc-950/90 p-6 backdrop-blur-2xl shadow-[0_0_60px_rgba(255,255,255,0.15)] transition-all duration-200 ${
              phase === 'hold' ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            {/* Header / Protocol tag */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-white uppercase">
                  CYBER PROTOCOL // RN-GATEWAY
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 tabular-nums">{hexHash}</span>
            </div>

            {/* Target module label */}
            <div className="py-5 space-y-2 text-center">
              <div className="flex justify-center">
                {targetLabel.includes('ADMIN') ? (
                  <div className="h-10 w-10 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
                    <Lock size={18} className="text-white" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
                    <Globe2 size={18} className="text-white" />
                  </div>
                )}
              </div>
              <div className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
                INITIATING HANDSHAKE
              </div>
              <h2 className="text-sm font-bold tracking-wider text-white uppercase break-words">
                {targetLabel}
              </h2>
            </div>

            {/* High-tech Segmented Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>ENCRYPTED SHUTTER</span>
                <span className="tabular-nums font-mono text-white">{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-white transition-all duration-150 shadow-[0_0_12px_#ffffff]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Bottom status badge */}
            <div className="mt-4 flex items-center justify-between text-[9px] text-zinc-500 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <Radio size={11} className="text-white animate-pulse" />
                CLEARANCE: CIPHER_LEVEL_0
              </span>
              <span>P2P DECRYPTED</span>
            </div>
          </div>
        </div>
      )}
    </CyberTransitionContext.Provider>
  );
}
