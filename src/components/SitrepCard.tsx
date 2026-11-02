import { useState } from 'react';
import { Check, Copy, ExternalLink, Share2 } from 'lucide-react';
import type { OsintEvent } from '../types';
import CategoryBadge from './CategoryBadge';
import { copyText, dispatchText, formatAgo, formatCoords } from '../utils/format';

export default function SitrepCard({
  event,
  now,
}: {
  event: OsintEvent;
  now: number;
}) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleShare = async () => {
    const text = dispatchText(event);
    const url = event.sourceUrl || window.location.href;
    const shareData = {
      title: event.title,
      text: `${event.title}\n\n${event.summary}`,
      url,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyText = async () => {
    if (await copyText(dispatchText(event))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="space-y-4 px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <CategoryBadge category={event.category} tags={event.tags} />
        <span className="shrink-0 text-[10px] font-mono tracking-wider text-zinc-400 tabular-nums">
          {formatAgo(event.createdAt, now)}
        </span>
      </div>

      <h3 className="text-base font-bold leading-snug text-white tracking-tight">{event.title}</h3>

      <div className="space-y-0.5 text-[11px] tracking-wide">
        <div className="font-semibold text-zinc-200">{event.locationName || 'UNSPECIFIED LOCATION'}</div>
        <div className="text-zinc-500 tabular-nums text-[10px] font-mono">COORDS: {formatCoords(event.lat, event.lng)}</div>
      </div>

      <p className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-[13px] leading-relaxed text-zinc-300">
        {event.summary}
      </p>

      {event.mediaUrl && !imgError && (
        <img
          src={event.mediaUrl}
          alt={event.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgError(true)}
          className="max-h-64 w-full rounded-xl border border-white/10 object-cover"
        />
      )}

      {/* Primary Actions: Article Link + Share Dispatch */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {event.sourceUrl ? (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="tac-btn min-h-[44px] border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:border-white/40 font-semibold"
          >
            <ExternalLink size={14} className="shrink-0" />
            <span className="truncate">ARTICLE LINK</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="tac-btn min-h-[44px] opacity-35 cursor-not-allowed border-white/5 bg-white/[0.02] text-zinc-500"
            title="No source article link available for this dispatch"
          >
            <ExternalLink size={14} className="shrink-0" />
            <span className="truncate">NO LINK</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleShare}
          className="tac-btn tac-btn-active min-h-[44px] font-semibold"
        >
          {shared || copied ? <Check size={14} className="shrink-0" /> : <Share2 size={14} className="shrink-0" />}
          <span className="truncate">{shared ? 'SHARED' : copied ? 'COPIED' : 'SHARE'}</span>
        </button>
      </div>

      {/* Quick raw dispatch copy */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={handleCopyText}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono tracking-wider text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <Copy size={11} />
          <span>{copied ? 'RAW DISPATCH COPIED TO CLIPBOARD' : 'COPY RAW DISPATCH TEXT'}</span>
        </button>
      </div>
    </article>
  );
}
