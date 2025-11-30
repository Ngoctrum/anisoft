import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ToolCard } from '@/components/ToolCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Loader2 } from 'lucide-react';

interface ToolsListPageProps {
  title: string;
  description: string;
  category?: 'tool' | 'code' | 'website' | 'courses' | 'all';
  icon?: React.ReactNode;
}

export function ToolsListPage({ title, description, category = 'all', icon }: ToolsListPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

  useEffect(() => {
    loadTools();
  }, [searchQuery, sortBy, statusFilter, category]);

  const loadTools = async () => {
    setLoading(true);
    let query = supabase
      .from('tools')
      .select('*')
      .eq('tool_type', 'download')
      .eq('is_active', true);

    // Apply category filter  
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Apply search filter
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
    }

    // Apply status badge filter
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status_badge', statusFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('total_downloads', { ascending: false });
        break;
      case 'featured':
        query = query.eq('is_featured', true).order('created_at', { ascending: false });
        break;
      case 'updated':
        query = query.order('updated_at', { ascending: false });
        break;
    }

    const { data } = await query;
    setTools(data || []);
    setLoading(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {icon && <div className="text-primary">{icon}</div>}
            <h1 className="text-4xl font-bold">{title}</h1>
          </div>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gradient-card border border-border rounded-lg p-4 mb-8 shadow-glow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-background/50"
                />
                <Button onClick={handleSearch} className="bg-gradient-primary">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="new">🆕 Mới</SelectItem>
                <SelectItem value="updated">🔄 Cập nhật</SelectItem>
                <SelectItem value="hot">🔥 Hot</SelectItem>
                <SelectItem value="popular">⭐ Phổ biến</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="updated">Vừa cập nhật</SelectItem>
                <SelectItem value="popular">Phổ biến nhất</SelectItem>
                <SelectItem value="featured">Nổi bật</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        ) : tools.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                {tools.length}
              </span>
              <span>kết quả được tìm thấy</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <ToolCard key={tool.id} {...tool} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gradient-card border border-border rounded-lg">
            <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy kết quả</h3>
            <p className="text-muted-foreground mb-4">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSortBy('newest');
                setSearchParams(new URLSearchParams());
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
