import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Tool {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  download_url: string;
  thumbnail_url: string;
  tool_type: string;
}

export default function AppDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    loadTool();
  }, [slug]);

  useEffect(() => {
    if (tool && countdown > 0 && !redirecting) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && tool && !redirecting) {
      handleRedirect();
    }
  }, [countdown, tool, redirecting]);

  const loadTool = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('slug', slug)
      .eq('tool_type', 'interactive')
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      toast.error('Không tìm thấy app này');
      navigate('/apps');
      return;
    }

    setTool(data);
    setLoading(false);
  };

  const handleRedirect = () => {
    if (!tool?.download_url) return;
    setRedirecting(true);
    window.location.href = tool.download_url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-radial flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tool) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-radial flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/apps')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách Apps
          </Button>

          <Card className="bg-gradient-card border-border">
            <CardHeader className="text-center">
              {tool.thumbnail_url && (
                <div className="w-32 h-32 mx-auto mb-4 rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={tool.thumbnail_url} 
                    alt={tool.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardTitle className="text-3xl">{tool.title}</CardTitle>
              {tool.short_description && (
                <CardDescription className="text-lg">
                  {tool.short_description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              {tool.description && (
                <div className="text-muted-foreground">
                  {tool.description}
                </div>
              )}

              {!redirecting ? (
                <>
                  <div className="flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center">
                      <span className="text-5xl font-bold text-primary-foreground">
                        {countdown}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground">
                    Đang chuyển hướng trong {countdown} giây...
                  </p>

                  <Button 
                    onClick={handleRedirect}
                    className="w-full bg-gradient-primary"
                    size="lg"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Truy cập ngay
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Đang chuyển hướng...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
