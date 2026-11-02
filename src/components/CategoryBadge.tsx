import type { EventCategory } from '../types';
import { CATEGORIES, isAlertTag } from '../utils/categories';

interface Props {
  category?: EventCategory;
  tags?: string[];
}

export default function CategoryBadge({ category = 'general', tags }: Props) {
  const list = tags && tags.length > 0 ? tags : [CATEGORIES[category]?.defaultTag ?? 'Dispatch'];

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono">
      {list.map((tag, i) => {
        const alert = isAlertTag(tag);
        const colorClass = alert ? 'text-crimson font-bold' : 'text-zinc-300 font-medium';

        return (
          <span key={tag} className="inline-flex items-center gap-1.5">
            {i > 0 && <span className="text-zinc-600 select-none">·</span>}
            <span className={colorClass}>{tag}</span>
          </span>
        );
      })}
    </div>
  );
}
