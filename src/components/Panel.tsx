import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/format';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  side: 'left' | 'right';
  className?: string;
  children: ReactNode;
}

/** Smooth iOS slide-up bottom sheet on mobile (< 768px), floating glass panel on desktop (md+). */
export default function Panel({ open, onClose, title, side, className, children }: Props) {
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);

  const onDown = (e: PointerEvent) => {
    start.current = e.clientY;
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (start.current !== null) setDrag(Math.max(0, e.clientY - start.current));
  };
  const onUp = () => {
    if (drag > 75) onClose();
    start.current = null;
    setDrag(0);
  };

  return (
    <section
      aria-hidden={!open}
      style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 flex max-h-[76dvh] flex-col rounded-t-3xl border border-white/10 border-b-0 bg-zinc-950/95 backdrop-blur-2xl pb-[calc(env(safe-area-inset-bottom)+72px)] shadow-[0_-20px_50px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-out',
        'md:inset-x-auto md:bottom-24 md:top-24 md:max-h-none md:w-[400px] md:rounded-2xl md:border md:pb-0',
        side === 'left' ? 'md:left-4' : 'md:right-4',
        open
          ? 'translate-y-0 md:translate-x-0'
          : cn('pointer-events-none translate-y-full md:translate-y-0', side === 'left' ? 'md:-translate-x-[110%]' : 'md:translate-x-[110%]'),
        className,
      )}
    >
      <div
        className="flex min-h-[30px] cursor-grab touch-none items-center justify-center pb-1 pt-2 md:hidden"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="h-1 w-10 rounded-full bg-white/20" />
      </div>
      <header className="flex items-center justify-between border-b border-white/[0.08] px-4 pb-2.5 pt-1 md:pt-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <h2 className="text-xs font-bold font-mono tracking-widest text-white uppercase">{title}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="-mr-1 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/[0.08] hover:text-white active:scale-95"
        >
          <X size={18} />
        </button>
      </header>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
    </section>
  );
}
