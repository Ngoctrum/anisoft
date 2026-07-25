import { Link } from 'react-router-dom';

export interface NexusPlan {
  name: string;
  price: number;
  duration?: string;
}

export interface NexusProduct {
  id: string;
  slug: string;
  name: string;
  category_slug: string;
  short_description?: string | null;
  image_url?: string | null;
  plans: NexusPlan[];
  badge?: string | null;
  warranty?: string | null;
  is_featured?: boolean;
}

export const NexusProductCard = ({ p, tier = 'free' }: { p: NexusProduct; tier?: 'free' | 'vip' }) => {
  const isVip = tier === 'vip';
  const badgeText = isVip ? 'PRO' : 'FREE';
  const label = isVip ? 'VIP' : 'MIỄN PHÍ';
  const badgeCls = isVip
    ? 'bg-orange-500 text-white'
    : 'bg-emerald-500 text-white';
  const chipCls = isVip
    ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20'
    : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20';
  const btnCls = isVip
    ? 'bg-orange-500 hover:bg-orange-600'
    : 'bg-emerald-500 hover:bg-emerald-600';

  return (
    <div className="group relative flex flex-col rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#111c19] p-4 hover:shadow-[0_18px_40px_-20px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 transition-all">
      <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeCls}`}>
        {badgeText}
      </span>

      <div className="flex flex-col items-center text-center pt-2">
        <div className="w-16 h-16 rounded-full bg-black/[0.03] dark:bg-white/5 flex items-center justify-center overflow-hidden mb-3 ring-1 ring-black/5 dark:ring-white/10">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} loading="lazy" className="w-10 h-10 object-contain" />
          ) : (
            <span className="text-lg font-bold text-emerald-500">{p.name.slice(0, 1)}</span>
          )}
        </div>
        <h3 className="font-heading font-extrabold text-sm uppercase tracking-wide line-clamp-1">{p.name}</h3>
        <div className={`mt-2 inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-semibold border ${chipCls}`}>
          {label}
        </div>
      </div>

      <Link
        to={`/products/${p.slug}`}
        className={`mt-4 block text-center text-white text-xs font-bold uppercase tracking-wide py-2.5 rounded-xl transition-colors ${btnCls}`}
      >
        Truy cập ngay
      </Link>
    </div>
  );
};
