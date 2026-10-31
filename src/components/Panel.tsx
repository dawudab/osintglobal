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

/** Bottom sheet on mobile (drag handle to dismiss), floating sidebar on md+. */
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
    if (drag > 80) onClose();
    start.current = null;
    setDrag(0);
  };

  return (
    <section
      aria-hidden={!open}
      style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
      className={cn(
        'glass fixed inset-x-0 bottom-0 z-30 flex max-h-[72dvh] flex-col rounded-t-2xl border-b-0 pb-[calc(env(safe-area-inset-bottom)+76px)] shadow-[0_-8px_40px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out',
        'md:inset-x-auto md:bottom-24 md:top-20 md:max-h-none md:w-[380px] md:rounded-xl md:border-b md:pb-0',
        side === 'left' ? 'md:left-4' : 'md:right-4',
        open
          ? 'translate-y-0 md:translate-x-0'
          : cn('pointer-events-none translate-y-full md:translate-y-0', side === 'left' ? 'md:-translate-x-[110%]' : 'md:translate-x-[110%]'),
        className,
      )}
    >
      <div
        className="flex cursor-grab touch-none justify-center pb-1 pt-2.5 md:hidden"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="h-1.5 w-12 rounded-full bg-amber/50" />
      </div>
      <header className="flex items-center justify-between border-b border-amber/20 px-4 pb-2 md:pt-3">
        <h2 className="hud-label">{title}</h2>
        <button onClick={onClose} aria-label="Close panel" className="-mr-2 grid h-10 w-10 place-items-center text-amber/80 active:text-amber">
          <X size={18} />
        </button>
      </header>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
    </section>
  );
}
