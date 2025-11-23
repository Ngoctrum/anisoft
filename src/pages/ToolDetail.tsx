import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ToolCard } from '@/components/ToolCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Download, Calendar, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ToolDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState<any>(null);
  const [relatedTools, setRelatedTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadTool();
    }
  }, [slug]);

  const loadTool = async () => {
    setLoading(true);

    // Load tool
    const { data: toolData, error } = await supabase
      .from('tools')
      .select(`
        *,
        profiles:author_user_id (
          username,
          display_name
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !toolData) {
      toast.error('Không tìm thấy tool');
      navigate('/tools');
      return;
    }

    setTool(toolData);

    // Load related tools (same category, download type only)
    const { data: related } = await supabase
      .from('tools')
      .select('*')
      .eq('tool_type', 'download')
      .eq('category', toolData.category)
      .neq('id', toolData.id)
      .eq('is_active', true)
      .limit(3);

    setRelatedTools(related || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <p className="text-center text-muted-foreground">Đang tải...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!tool) return null;

  const getBadgeStyle = (badge: string) => {
    const styles: Record<string, string> = {
      new: "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg",
      updated: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg",
      hot: "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg",
      popular: "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg",
    };
    return styles[badge.toLowerCase()] || "bg-primary text-primary-foreground shadow-lg";
  };

  const getBadgeText = (badge: string) => {
    const texts: Record<string, string> = {
      new: "🆕 Mới",
      updated: "🔄 Cập nhật",
      hot: "🔥 Hot",
      popular: "⭐ Phổ biến",
    };
    return texts[badge.toLowerCase()] || badge;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thumbnail */}
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              {tool.thumbnail_url ? (
                <img
                  src={tool.thumbnail_url}
                  alt={tool.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-primary opacity-20">
                  <Download className="h-24 w-24" />
                </div>
              )}
            </div>

            {/* Title and metadata */}
            <div>
              <div className="flex items-start gap-3 mb-4">
                <h1 className="text-4xl font-bold flex-1">{tool.title}</h1>
                {tool.status_badge && (
                  <Badge className={getBadgeStyle(tool.status_badge)}>
                    {getBadgeText(tool.status_badge)}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(tool.created_at).toLocaleDateString('vi-VN')}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  {tool.total_downloads.toLocaleString()} lượt tải
                </span>
                {tool.profiles && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {tool.profiles.display_name || tool.profiles.username}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{tool.category}</Badge>
                {tool.is_featured && (
                  <Badge className="bg-accent">Nổi bật</Badge>
                )}
                {tool.tags?.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-semibold mb-4">Mô tả</h2>
              {tool.short_description && (
                <p className="text-lg text-muted-foreground mb-4">
                  {tool.short_description}
                </p>
              )}
              {tool.description && (
                <div className="whitespace-pre-wrap">{tool.description}</div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Download card */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4 sticky top-20">
              <Button
                size="lg"
                className="w-full bg-gradient-primary"
                onClick={() => navigate(`/download/${tool.id}`)}
              >
                <Download className="mr-2 h-5 w-5" />
                Tải xuống
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => navigate(`/report?tool=${tool.id}`)}
              >
                <AlertCircle className="mr-2 h-5 w-5" />
                Báo lỗi
              </Button>

              <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
                <p>
                  <strong>Danh mục:</strong> {tool.category}
                </p>
                <p>
                  <strong>Lượt tải:</strong> {tool.total_downloads.toLocaleString()}
                </p>
                <p>
                  <strong>Cập nhật:</strong>{' '}
                  {new Date(tool.updated_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related tools */}
        {relatedTools.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Tools liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedTools.map((relatedTool) => (
                <ToolCard key={relatedTool.id} {...relatedTool} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}