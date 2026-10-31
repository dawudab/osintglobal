import type { EventCategory } from '../types';
import { CATEGORIES, hexToRgba } from '../utils/categories';

export default function CategoryBadge({ category }: { category: EventCategory }) {
  const { label, color } = CATEGORIES[category];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[10px] font-bold tracking-widest"
      style={{ color, borderColor: hexToRgba(color, 0.5), background: hexToRgba(color, 0.1) }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      {label}
    </span>
  );
}
