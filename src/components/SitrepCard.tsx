import { useState } from 'react';
import { Check, Copy, Crosshair, ExternalLink } from 'lucide-react';
import type { OsintEvent } from '../types';
import CategoryBadge from './CategoryBadge';
import { copyText, formatAgo, formatCoords, sitrepText } from '../utils/format';

export default function SitrepCard({ event, now, onFocus }: { event: OsintEvent; now: number; onFocus: () => void }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (await copyText(sitrepText(event))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <article className="space-y-3 px-4 py-3">
      <div className="flex items-center justify-between">
        <CategoryBadge category={event.category} />
        <span className="text-[11px] font-bold tracking-widest text-radar">{formatAgo(event.createdAt, now)}</span>
      </div>
      <h3 className="text-base font-bold leading-snug text-slate-100">{event.title}</h3>
      <div className="space-y-0.5 text-[11px] tracking-wide">
        <div className="text-amber">{event.locationName || 'UNKNOWN LOCATION'}</div>
        <div className="text-radar/80">LAT / LNG: {formatCoords(event.lat, event.lng)}</div>
      </div>
      <p className="border-l-2 border-amber/40 pl-3 text-[13px] leading-relaxed text-slate-300">{event.summary}</p>
      {event.mediaUrl && (
        <img src={event.mediaUrl} alt="" referrerPolicy="no-referrer" loading="lazy" className="max-h-64 w-full rounded border border-slate-800 object-cover" />
      )}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {event.sourceUrl ? (
          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="tac-btn">
            [ SOURCE <ExternalLink size={13} /> ]
          </a>
        ) : (
          <button onClick={onFocus} className="tac-btn">
            [ <Crosshair size={13} /> FOCUS ]
          </button>
        )}
        <button onClick={share} className="tac-btn border-radar/40 text-radar">
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'COPIED' : '[ SHARE SITREP ]'}
        </button>
      </div>
    </article>
  );
}
