import { useState } from 'react';
import { Check, Copy, Heart, ShieldCheck, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
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
    memo: 'Zero-Trace Private Support',
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin (SegWit)',
    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    memo: 'Direct Node Infrastructure',
  },
];

export default function DonationModal({ open, onClose }: Props) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md font-mono overflow-y-auto"
    >
      <div className="relative w-full max-w-lg my-auto max-h-[calc(100dvh-1.5rem)] flex flex-col rounded-2xl border border-white/20 bg-zinc-950 p-4 sm:p-5 shadow-[0_0_60px_rgba(255,255,255,0.12)] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-white fill-white/20" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white">
              RESISTANCE FUND // COMMUNITY SUPPORT
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close donations"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-3 py-3 overflow-y-auto min-h-0 flex-1">
          {/* Vision Statement */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-relaxed text-zinc-300">
            <p className="flex items-start gap-2">
              <ShieldCheck size={16} className="shrink-0 text-white mt-0.5" />
              <span>
                The <strong className="text-white">Global Resistance Network</strong> is 100% community-funded, tracker-free, and autonomous. Your contributions directly fund decentralized hosting nodes, unthrottled frontlines, and censorship-resistant relay bandwidth.
              </span>
            </p>
          </div>

          {/* Wallets */}
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
                    <span className="text-[10px] text-zinc-500 uppercase">{w.memo}</span>
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

        {/* Footer info */}
        <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-zinc-500 shrink-0">
          <span>OPSEC GUARANTEE: NO TRACKING / DIRECT ON-CHAIN</span>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-1.5 text-[11px] font-bold bg-white text-black hover:bg-zinc-200 active:scale-95"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}
