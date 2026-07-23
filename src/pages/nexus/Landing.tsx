import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NexusLayout } from '@/components/nexus/NexusLayout';
import { NexusProductCard, NexusProduct } from '@/components/nexus/NexusProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Zap, HeartHandshake, Sparkles } from 'lucide-react';

interface Category {
  slug: string;
  name: string;
  icon: string | null;
}

export default function NexusLanding() {
  const [featured, setFeatured] = useState<NexusProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('nexus_products').select('*').eq('is_active', true).eq('is_featured', true).order('sort_order').limit(8),
        supabase.from('nexus_categories').select('slug,name,icon').eq('is_active', true).order('sort_order'),
      ]);
      setFeatured((prods as any) || []);
      setCategories((cats as any) || []);
    })();
  }, []);

  return (
    <NexusLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        </div>
        <div className="container py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-xs mb-6">
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-500" />
            <span className="text-muted-foreground">Kho tài khoản premium chính hãng</span>
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold leading-[1.1] tracking-tight max-w-3xl mx-auto">
            Sở hữu <span className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-600 bg-clip-text text-transparent">tài khoản premium</span>
            <br />
            chỉ từ vài chục nghìn đồng
          </h1>
          <p className="mt-6 text-muted-foreground max-w-xl mx-auto">
            ChatGPT Plus, Netflix, Canva Pro, Spotify, YouTube Premium… bảo hành trọn gói, giao tài khoản trong vài phút.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white hover:opacity-90 rounded-full px-8">
              <Link to="/products">
                Xem sản phẩm <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <Link to="/products?cat=chatgpt">ChatGPT Plus</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container py-8">
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/products?cat=${c.slug}`}
              className="px-4 py-2 rounded-full text-sm border border-border bg-card/50 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-12">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: 'Bảo hành trọn gói', desc: '1-1 nếu tài khoản gặp sự cố trong thời gian sử dụng.' },
            { icon: Zap, title: 'Giao ngay lập tức', desc: 'Sau khi xác nhận đơn, gửi tài khoản trong vài phút.' },
            { icon: HeartHandshake, title: 'Hỗ trợ 24/7', desc: 'Zalo, Telegram luôn sẵn sàng giải quyết sự cố.' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-border bg-card/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5 text-fuchsia-500" />
              </div>
              <h3 className="font-heading font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold">Sản phẩm nổi bật</h2>
            <p className="text-sm text-muted-foreground">Được đông đảo khách hàng lựa chọn</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-primary">
            <Link to="/products">Xem tất cả <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((p) => (
            <NexusProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-transparent p-8 md:p-12 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold">Không tìm thấy dịch vụ bạn cần?</h2>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">Nhắn cho chúng tôi qua Zalo / Telegram — hầu như dịch vụ premium nào cũng có.</p>
          <Button asChild size="lg" className="mt-6 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white rounded-full">
            <Link to="/products">Khám phá ngay</Link>
          </Button>
        </div>
      </section>
    </NexusLayout>
  );
}
