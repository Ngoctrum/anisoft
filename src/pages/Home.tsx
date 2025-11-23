import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ToolCard } from '@/components/ToolCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Download, Code2, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [featuredTools, setFeaturedTools] = useState<any[]>([]);
  const [recentTools, setRecentTools] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    // Load featured tools
    const { data: featured } = await supabase
      .from('tools')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (featured) setFeaturedTools(featured);

    // Load recent tools
    const { data: recent } = await supabase
      .from('tools')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (recent) setRecentTools(recent);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/tools?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm">Your Hub for Tools & Code</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Khám phá hàng ngàn{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Tools & Code
              </span>{' '}
              miễn phí
            </h1>
            
            <p className="text-xl text-muted-foreground">
              Chia sẻ và tải xuống các công cụ, mã nguồn, và template website chất lượng cao từ cộng đồng Ani Studio
            </p>

            <div className="flex gap-2 max-w-xl mx-auto">
              <Input
                placeholder="Tìm kiếm tools, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-12"
              />
              <Button size="lg" onClick={handleSearch} className="bg-gradient-primary h-12">
                <Search className="h-5 w-5 mr-2" />
                Tìm kiếm
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Tools */}
        {featuredTools.length > 0 && (
          <section className="container py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Tools Nổi Bật</h2>
              <Button variant="ghost" onClick={() => navigate('/tools')}>
                Xem tất cả →
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTools.map((tool) => (
                <ToolCard key={tool.id} {...tool} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Tools */}
        {recentTools.length > 0 && (
          <section className="container py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Mới Cập Nhật</h2>
              <Button variant="ghost" onClick={() => navigate('/tools')}>
                Xem tất cả →
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentTools.map((tool) => (
                <ToolCard key={tool.id} {...tool} />
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="container py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div 
              onClick={() => navigate('/tools')}
              className="group cursor-pointer bg-gradient-card border border-border rounded-xl p-8 hover:border-primary/50 transition-all hover:shadow-glow"
            >
              <Download className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Tools</h3>
              <p className="text-muted-foreground">
                Các công cụ hữu ích và tiện lợi
              </p>
            </div>
            <div 
              onClick={() => navigate('/code')}
              className="group cursor-pointer bg-gradient-card border border-border rounded-xl p-8 hover:border-primary/50 transition-all hover:shadow-glow"
            >
              <Code2 className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Code</h3>
              <p className="text-muted-foreground">
                Mã nguồn và script chất lượng cao
              </p>
            </div>
            <div 
              onClick={() => navigate('/website')}
              className="group cursor-pointer bg-gradient-card border border-border rounded-xl p-8 hover:border-primary/50 transition-all hover:shadow-glow"
            >
              <Globe className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Website</h3>
              <p className="text-muted-foreground">
                Template website đẹp và responsive
              </p>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto text-center space-y-6 bg-gradient-card p-12 rounded-2xl border border-border">
            <h2 className="text-3xl font-bold">Sẵn sàng bắt đầu?</h2>
            <p className="text-lg text-muted-foreground">
              Tham gia cộng đồng Ani Studio để chia sẻ và khám phá những tools tuyệt vời
            </p>
            <Button size="lg" className="bg-gradient-primary" onClick={() => navigate('/register')}>
              Đăng ký ngay
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}