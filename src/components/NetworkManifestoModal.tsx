import { Cpu, Radio, Shield, Terminal, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NetworkManifestoModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md font-mono overflow-y-auto"
    >
      <div className="relative w-full max-w-lg my-auto max-h-[calc(100dvh-1.5rem)] flex flex-col rounded-2xl border border-white/20 bg-zinc-950 p-4 sm:p-5 shadow-[0_0_60px_rgba(255,255,255,0.12)] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-white animate-pulse" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white">
              NETWORK TELEMETRY // MANIFESTO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close manifesto"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-3 py-3 overflow-y-auto min-h-0 flex-1">
          {/* Status specs */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
              <span className="text-[9px] text-zinc-500 uppercase block">NODE PROTOCOL</span>
              <span className="text-white font-bold">BITTENSOR TAO SUBNET</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
              <span className="text-[9px] text-zinc-500 uppercase block">ENCRYPTION LEVEL</span>
              <span className="text-white font-bold">ZERO-KNOWLEDGE OPSEC</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
              <span className="text-[9px] text-zinc-500 uppercase block">TELEMETRY TRACKERS</span>
              <span className="text-white font-bold">0 INJECTED (STRICT)</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
              <span className="text-[9px] text-zinc-500 uppercase block">POLLING FREQUENCY</span>
              <span className="text-white font-bold">60 SEC AUTONOMOUS</span>
            </div>
          </div>

          {/* Content text */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-zinc-300 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Terminal size={15} className="shrink-0 text-white mt-0.5" />
              <div>
                <strong className="text-white uppercase text-[11px]">Frontline Decentralization:</strong>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Centralized media channels can be filtered, blocked, or altered. The Global Resistance Network operates on distributed consensus to keep eyes on ground realities worldwide.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Shield size={15} className="shrink-0 text-white mt-0.5" />
              <div>
                <strong className="text-white uppercase text-[11px]">Zero-Trace Fingerprinting:</strong>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  No third-party trackers, no behavioral cookies, no advertising scripts. Images undergo client-side Canvas EXIF stripping before transmission to protect sources and dispatches.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Cpu size={15} className="shrink-0 text-white mt-0.5" />
              <div>
                <strong className="text-white uppercase text-[11px]">Subnet Redundancy:</strong>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Dispatches are mirrored across resilient edge networks and decentralized storage nodes to prevent takedown or single-point failure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-zinc-500 shrink-0">
          <span>SHA-256 // VERIFIED BUILD</span>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-1.5 text-[11px] font-bold bg-white text-black hover:bg-zinc-200 active:scale-95"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
}
