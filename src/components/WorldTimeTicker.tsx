import { useEffect, useState } from 'react';

interface CityDef {
  name: string;
  tz: string;
}

const CITIES: CityDef[] = [
  { name: 'TOKYO', tz: 'Asia/Tokyo' },
  { name: 'NEW YORK', tz: 'America/New_York' },
  { name: 'MOSCOW', tz: 'Europe/Moscow' },
  { name: 'PARIS', tz: 'Europe/Paris' },
  { name: 'LONDON', tz: 'Europe/London' },
  { name: 'JOHANNESBURG', tz: 'Africa/Johannesburg' },
  { name: 'SYDNEY', tz: 'Australia/Sydney' },
  { name: 'MECCA', tz: 'Asia/Riyadh' },
  { name: 'LOS ANGELES', tz: 'America/Los_Angeles' },
  { name: 'UTC', tz: 'UTC' },
];

function formatTime(tz: string, date: Date) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    }).format(date);
  } catch {
    return '--:--';
  }
}

export default function WorldTimeTicker() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Update every 5 seconds to keep minute synchronization exact with minimal overhead
    const id = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(id);
  }, []);

  const cityTimes = CITIES.map((c) => ({
    name: c.name,
    time: formatTime(c.tz, now),
  }));

  return (
    <div className="relative w-full overflow-hidden select-none py-0.5">
      {/* Soft gradient masks at edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black via-black/60 to-transparent z-10" />

      {/* Marquee Ticker Track */}
      <div className="animate-marquee flex items-center gap-6 sm:gap-8 font-mono text-[11px] whitespace-nowrap">
        {/* Set 1 */}
        {cityTimes.map((c, i) => (
          <span key={`a-${i}`} className="inline-flex items-center gap-1.5 tracking-wider">
            <span className="text-zinc-500 font-medium text-[10px] sm:text-[11px]">{c.name}</span>
            <span className="text-zinc-100 font-bold tabular-nums text-[11px] sm:text-[12px]">{c.time}</span>
          </span>
        ))}

        {/* Set 2 (for seamless infinite loop) */}
        {cityTimes.map((c, i) => (
          <span key={`b-${i}`} className="inline-flex items-center gap-1.5 tracking-wider">
            <span className="text-zinc-500 font-medium text-[10px] sm:text-[11px]">{c.name}</span>
            <span className="text-zinc-100 font-bold tabular-nums text-[11px] sm:text-[12px]">{c.time}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
