import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NexusLayout } from '@/components/nexus/NexusLayout';
import { NexusProductCard, NexusProduct } from '@/components/nexus/NexusProductCard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, PackageOpen } from 'lucide-react';

interface Cat {
  slug: string;
  name: string;
}

export default function NexusProducts() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || 'all';
  const [products, setProducts] = useState<NexusProduct[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('nexus_products').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('nexus_categories').select('slug,name').eq('is_active', true).order('sort_order'),
      ]);
      setProducts((prods as any) || []);
      setCategories((cats as any) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (cat !== 'all' && p.category_slug !== cat) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [products, cat, q]);

  const setCat = (c: string) => {
    const next = new URLSearchParams(params);
    if (c === 'all') next.delete('cat');
    else next.set('cat', c);
    setParams(next);
  };

  const allCats = [{ slug: 'all', name: 'Tất cả' }, ...categories];

  return (
    <NexusLayout>
      <section>
        {/* Header + Search inline */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight">Tất cả sản phẩm</h1>
            <p className="text-sm text-muted-foreground mt-1">Chọn danh mục phù hợp với bạn.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm sản phẩm..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Tìm sản phẩm"
              className="pl-9 h-10 rounded-full bg-black/[0.02] dark:bg-white/5 border-black/10 dark:border-white/10 focus-visible:ring-emerald-500/70"
            />
          </div>
        </div>

        {/* Compact horizontal-scroll pill filter */}
        <div className="mt-5 -mx-3 md:-mx-8 px-3 md:px-8 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 min-w-max pb-1">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-24 rounded-full" />
                ))
              : allCats.map((c) => {
                  const active = cat === c.slug;
                  return (
                    <button
                      key={c.slug}
                      onClick={() => setCat(c.slug)}
                      aria-pressed={active}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0f1a17] ${
                        active
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_6px_18px_-6px_rgba(16,185,129,0.7)]'
                          : 'bg-black/[0.04] dark:bg-white/5 text-foreground/70 hover:text-foreground hover:bg-emerald-500/10'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
          </div>
        </div>

        {/* Grid or Skeleton */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-black/5 dark:border-white/5 p-4 space-y-3">
                <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-3 w-1/2 mx-auto" />
                <Skeleton className="h-9 w-full rounded-full" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full flex flex-col items-center py-16 text-muted-foreground">
              <PackageOpen className="h-10 w-10 mb-2 text-muted-foreground/60" />
              <p className="text-sm">Không tìm thấy sản phẩm phù hợp.</p>
            </div>
          ) : (
            filtered.map((p) => <NexusProductCard key={p.id} p={p} />)
          )}
        </div>
      </section>
    </NexusLayout>
  );
}
