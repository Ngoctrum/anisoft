import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NexusLayout } from '@/components/nexus/NexusLayout';
import { NexusProductCard, NexusProduct } from '@/components/nexus/NexusProductCard';
import { ChevronRight, GraduationCap, Users, Sparkles } from 'lucide-react';

export default function NexusLanding() {
  const [products, setProducts] = useState<NexusProduct[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('nexus_products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .limit(20);
      setProducts((data as any) || []);
    })();
  }, []);

  const freeProducts = products.slice(0, 10);
  const vipProducts = products.slice(0, 8);

  return (
    <NexusLayout>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-500/10 dark:via-transparent dark:to-emerald-500/5 border border-emerald-500/10 px-6 py-12 md:py-16 text-center">
        <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative">
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold uppercase leading-tight tracking-tight">
            Đời sinh viên khó<br />
            Để <span className="text-emerald-500">NEXUS OVERRIDE</span> lo
          </h1>
          <div className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex -space-x-1">
              <span className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0f1a17] text-white text-[10px] font-bold flex items-center justify-center">N</span>
              <span className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white dark:border-[#0f1a17] text-white text-[10px] font-bold flex items-center justify-center">O</span>
              <span className="w-6 h-6 rounded-full bg-violet-500 border-2 border-white dark:border-[#0f1a17] text-white text-[10px] font-bold flex items-center justify-center">V</span>
            </span>
            <span><b className="text-foreground">+500 người</b> đang sử dụng mỗi tháng</span>
          </div>
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-lg shadow-emerald-500/30 transition-colors"
            >
              Xem dịch vụ miễn phí
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-3 gap-3 md:gap-6 py-10 md:py-14 text-center">
        {[
          { n: '500+', l: 'Người đang sử dụng', c: 'text-emerald-500' },
          { n: '20+', l: 'Dịch vụ premium', c: 'text-violet-500' },
          { n: '99%', l: 'Phản hồi tích cực', c: 'text-orange-500' },
        ].map((s) => (
          <div key={s.l}>
            <div className={`text-3xl md:text-5xl font-heading font-extrabold ${s.c}`}>{s.n}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest mt-1">{s.l}</div>
          </div>
        ))}
      </section>

      {/* FEATURE BANNER */}
      <Link
        to="/products?cat=streaming"
        className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/60 dark:bg-red-500/5 px-4 md:px-6 py-3 md:py-4 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mb-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg bg-black flex items-center justify-center text-red-500 font-heading font-black text-lg">
            N
          </div>
          <div className="font-heading font-extrabold text-sm md:text-lg text-red-600 dark:text-red-400 uppercase tracking-tight">
            Xem Netflix Premium <span className="text-foreground">miễn phí</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-red-500 flex-shrink-0" />
      </Link>

      {/* FREE SECTION */}
      <Section
        title="Dịch vụ miễn phí"
        icon={<Users className="h-4 w-4" />}
        badge="MIỄN PHÍ"
        badgeCls="bg-emerald-500 text-white"
        subLine={{ icon: <GraduationCap className="h-3.5 w-3.5" />, text: 'Tài khoản xài chung nhiều người' }}
        tone="emerald"
      >
        <ProductGrid items={freeProducts} tier="free" />
      </Section>

      {/* VIP SECTION */}
      <div className="mt-10">
        <Section
          title="Dịch vụ VIP"
          icon={<Sparkles className="h-4 w-4" />}
          badge="VIP"
          badgeCls="bg-orange-500 text-white"
          subLine={{ icon: <Sparkles className="h-3.5 w-3.5" />, text: 'Tài khoản riêng, bảo hành trọn gói' }}
          tone="orange"
        >
          <ProductGrid items={vipProducts} tier="vip" />
        </Section>
      </div>
    </NexusLayout>
  );
}

const Section = ({
  title,
  icon,
  badge,
  badgeCls,
  subLine,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge: string;
  badgeCls: string;
  subLine: { icon: React.ReactNode; text: string };
  tone: 'emerald' | 'orange';
  children: React.ReactNode;
}) => {
  const border = tone === 'emerald' ? 'border-emerald-500/20' : 'border-orange-500/20';
  const bg = tone === 'emerald' ? 'bg-emerald-50/40 dark:bg-emerald-500/5' : 'bg-orange-50/40 dark:bg-orange-500/5';
  const iconBg = tone === 'emerald' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white';
  const chip = tone === 'emerald'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
    : 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300 border-orange-200 dark:border-orange-500/20';

  return (
    <section className={`rounded-3xl border ${border} ${bg} p-4 md:p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
          <div>
            <h2 className="font-heading font-extrabold uppercase text-base md:text-lg tracking-tight">{title}</h2>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${badgeCls}`}>{badge}</span>
      </div>
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium mb-4 ${chip}`}>
        {subLine.icon}
        {subLine.text}
      </div>
      {children}
    </section>
  );
};

const ProductGrid = ({ items, tier }: { items: NexusProduct[]; tier: 'free' | 'vip' }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
    {items.map((p) => (
      <NexusProductCard key={p.id} p={p} tier={tier} />
    ))}
  </div>
);
