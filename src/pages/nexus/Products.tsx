import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NexusLayout } from '@/components/nexus/NexusLayout';
import { NexusProductCard, NexusProduct } from '@/components/nexus/NexusProductCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Cat { slug: string; name: string; }

export default function NexusProducts() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || 'all';
  const [products, setProducts] = useState<NexusProduct[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('nexus_products').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('nexus_categories').select('slug,name').eq('is_active', true).order('sort_order'),
      ]);
      setProducts((prods as any) || []);
      setCategories((cats as any) || []);
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

  return (
    <NexusLayout>
      <section className="container py-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold">Tất cả sản phẩm</h1>
        <p className="text-muted-foreground mt-1">Chọn danh mục và sản phẩm phù hợp với bạn.</p>

        <div className="mt-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCat('all')}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                cat === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'
              }`}
            >
              Tất cả
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCat(c.slug)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  cat === c.slug ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm sản phẩm..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <NexusProductCard key={p.id} p={p} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          )}
        </div>
      </section>
    </NexusLayout>
  );
}
