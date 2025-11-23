import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Tool {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  thumbnail_url: string;
  app_config: any;
  tool_type: string;
}

export default function Apps() {
  const navigate = useNavigate();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInteractiveTools();
  }, []);

  const loadInteractiveTools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tools')
      .select('id, title, slug, short_description, thumbnail_url, app_config, tool_type')
      .eq('tool_type', 'interactive')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTools(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-radial flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ⚡ Phần Mềm Online
            </h1>
            <p className="text-muted-foreground text-lg">
              Sử dụng các công cụ mạnh mẽ ngay trên trình duyệt, không cần cài đặt
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
          ) : tools.length === 0 ? (
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Chưa có phần mềm nào</h3>
                <p className="text-muted-foreground">
                  Các apps mới đang được phát triển. Quay lại sau nhé!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <Card 
                  key={tool.id} 
                  className="bg-gradient-card border-border hover:shadow-glow hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => navigate(`/apps/${tool.slug}`)}
                >
                  <CardHeader>
                    {tool.thumbnail_url && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4 bg-muted">
                        <img 
                          src={tool.thumbnail_url} 
                          alt={tool.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      </div>
                    )}
                    <CardTitle className="flex items-center gap-2">
                      {tool.title}
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        ⚡ App
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {tool.short_description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-gradient-primary group"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/apps/${tool.slug}`);
                      }}
                    >
                      Sử dụng ngay
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
