import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NexusLayout } from '@/components/nexus/NexusLayout';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Zap, ArrowLeft, Check } from 'lucide-react';
import { NexusProduct } from '@/components/nexus/NexusProductCard';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

export default function NexusProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState<NexusProduct | null>(null);
  const [description, setDescription] = useState<string>('');
  const [selected, setSelected] = useState<number>(0);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase.from('nexus_products').select('*').eq('slug', slug).maybeSingle();
      if (data) {
        setP(data as any);
        setDescription((data as any).description || '');
      }
    })();
  }, [slug]);

  if (!p) {
    return (
      <NexusLayout>
        <div className="container py-20 text-center text-muted-foreground">Đang tải…</div>
      </NexusLayout>
    );
  }

  const plan = p.plans[selected];

  const buy = () => {
    navigate(`/checkout?product=${p.slug}&plan=${encodeURIComponent(plan.name)}`);
  };

  return (
    <NexusLayout>
      <section className="container py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/products"><ArrowLeft className="h-4 w-4 mr-1" /> Quay lại</Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-3xl overflow-hidden border border-border bg-card">
            {p.image_url && (
              <img src={p.image_url} alt={p.name} className="w-full aspect-square object-cover" />
            )}
          </div>

          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold leading-tight">{p.name}</h1>
            {p.short_description && <p className="mt-2 text-muted-foreground">{p.short_description}</p>}

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                <ShieldCheck className="h-3.5 w-3.5" /> {p.warranty || 'Bảo hành trọn gói'}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-500 border border-fuchsia-500/30">
                <Zap className="h-3.5 w-3.5" /> Giao ngay
              </div>
            </div>

            <div className="mt-8">
              <div className="text-sm font-medium mb-3">Chọn gói:</div>
              <div className="grid gap-2">
                {p.plans.map((pl, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`w-full text-left flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                      selected === i ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selected === i ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {selected === i && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <div className="font-medium">{pl.name}</div>
                        {pl.duration && <div className="text-xs text-muted-foreground">{pl.duration}</div>}
                      </div>
                    </div>
                    <div className="font-bold text-lg bg-gradient-to-r from-fuchsia-500 to-violet-600 bg-clip-text text-transparent">
                      {fmt(pl.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={buy} size="lg" className="w-full mt-6 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white rounded-full">
              Đặt mua ngay — {fmt(plan.price)}
            </Button>

            {description && (
              <div className="mt-8 prose prose-invert max-w-none text-sm text-muted-foreground whitespace-pre-line">
                {description}
              </div>
            )}
          </div>
        </div>
      </section>
    </NexusLayout>
  );
}
