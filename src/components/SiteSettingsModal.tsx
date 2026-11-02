import { Volume2, VolumeX, Eye, RotateCw, X, Sparkles } from 'lucide-react';
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
  onUpdate: (updater: (prev: SiteSettings) => SiteSettings) => void;
}

export default function SiteSettingsModal({ open, onClose, settings, onUpdate }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md font-mono overflow-y-auto"
    >
      <div className="relative w-full max-w-md my-auto max-h-[calc(100dvh-1.5rem)] flex flex-col rounded-2xl border border-white/20 bg-zinc-950 p-4 sm:p-5 shadow-[0_0_50px_rgba(255,255,255,0.1)] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white">
              SITE CONFIGURATION // PREFERENCES
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Settings List */}
        <div className="space-y-2.5 sm:space-y-3 py-3 overflow-y-auto min-h-0 flex-1">
          {/* Sound FX */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                {settings.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                <span>SYNTH AUDIO FEEDBACK</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">Web Audio digital chimes on transitions & actions</p>
            </div>
            <button
              onClick={() => onUpdate((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
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

          {/* Globe Auto-Rotation */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <RotateCw size={15} />
                <span>GLOBE DRIFT / AUTO-ROTATE</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">Planetary rotation when user is idle</p>
            </div>
            <button
              onClick={() => onUpdate((s) => ({ ...s, autoRotate: !s.autoRotate }))}
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

          {/* Atmosphere Glow */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Eye size={15} />
                <span>ATMOSPHERE LUMINESCENCE</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">Bittensor ethereal globe rim halo</p>
            </div>
            <button
              onClick={() => onUpdate((s) => ({ ...s, atmosphereGlow: !s.atmosphereGlow }))}
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

        {/* Footer info */}
        <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-zinc-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles size={11} className="text-zinc-400" />
            PERSISTED LOCALLY
          </span>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-1.5 text-[11px] font-bold bg-white text-black hover:bg-zinc-200 transition-colors active:scale-95"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}
