import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ToolCard } from '@/components/ToolCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter } from 'lucide-react';

export default function Tools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  useEffect(() => {
    loadTools();
  }, [searchQuery, category, sortBy]);

  const loadTools = async () => {
    setLoading(true);
    let query = supabase
      .from('tools')
      .select('*')
      .eq('is_active', true);

    // Apply filters
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
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
    }

    const { data } = await query;
    setTools(data || []);
    setLoading(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (category !== 'all') params.set('category', category);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Khám Phá Tools</h1>
          <p className="text-muted-foreground">
            Tìm kiếm và tải xuống các công cụ, code và template từ cộng đồng
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} className="bg-gradient-primary">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="tool">Tools</SelectItem>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="website">Website</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="popular">Phổ biến</SelectItem>
                <SelectItem value="featured">Nổi bật</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        ) : tools.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Tìm thấy {tools.length} kết quả
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <ToolCard key={tool.id} {...tool} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy kết quả</h3>
            <p className="text-muted-foreground">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}