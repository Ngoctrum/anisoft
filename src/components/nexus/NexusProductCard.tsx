import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

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

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

export const NexusProductCard = ({ p }: { p: NexusProduct }) => {
  const minPrice = p.plans.length ? Math.min(...p.plans.map((x) => x.price)) : 0;
  return (
    <Link
      to={`/products/${p.slug}`}
      className="group relative flex flex-col rounded-2xl border border-border bg-card/60 hover:bg-card overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-fuchsia-500/10 transition-all"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {p.image_url && (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        {p.badge && (
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white border-0">
            {p.badge}
          </Badge>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex-1">
          <h3 className="font-heading font-semibold leading-snug line-clamp-1">{p.name}</h3>
          {p.short_description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_description}</p>
          )}
        </div>
        <div className="flex items-end justify-between pt-2 border-t border-border">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Chỉ từ</div>
            <div className="text-lg font-bold bg-gradient-to-r from-fuchsia-500 to-violet-600 bg-clip-text text-transparent">
              {fmt(minPrice)}
            </div>
          </div>
          {p.warranty && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Bảo hành
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
