import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Download, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Tool {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  app_config: any;
  tool_type: string;
}

export default function AppDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Image Generator State
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string>('');

  useEffect(() => {
    loadTool();
  }, [slug]);

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

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập mô tả ảnh');
      return;
    }

    setGenerating(true);
    setGeneratedImage('');

    try {
      const response = await supabase.functions.invoke('generate-image', {
        body: { prompt }
      });

      if (response.error) throw response.error;

      const imageUrl = response.data?.imageUrl;
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        toast.success('Đã tạo ảnh thành công!');
      } else {
        throw new Error('Không nhận được ảnh từ server');
      }
    } catch (error: any) {
      console.error('Generate image error:', error);
      toast.error('Lỗi khi tạo ảnh', {
        description: error.message
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ani-studio-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderAppInterface = () => {
    if (!tool) return null;

    const appType = tool.app_config?.type;

    switch (appType) {
      case 'image-generator':
        return (
          <div className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Tạo Ảnh AI
                </CardTitle>
                <CardDescription>
                  Mô tả ảnh bạn muốn tạo và AI sẽ vẽ cho bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Mô tả ảnh</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ví dụ: một chú mèo đang ngồi trên mặt trăng, phong cách anime, chi tiết cao..."
                    rows={4}
                    disabled={generating}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Mô tả càng chi tiết, ảnh càng đẹp. Hãy thử thêm: phong cách nghệ thuật, màu sắc, ánh sáng, góc nhìn...
                  </p>
                </div>

                <Button 
                  onClick={handleGenerateImage} 
                  disabled={generating || !prompt.trim()}
                  className="w-full bg-gradient-primary"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo ảnh... (có thể mất 10-15s)
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Tạo Ảnh
                    </>
                  )}
                </Button>

                {generatedImage && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                    <div className="relative rounded-lg overflow-hidden border-2 border-primary/20 bg-muted">
                      <img 
                        src={generatedImage} 
                        alt="Generated" 
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={downloadImage}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Tải xuống
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setGeneratedImage('');
                          setPrompt('');
                        }}
                      >
                        Tạo ảnh mới
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {tool.description && (
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle>Hướng dẫn sử dụng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {tool.description}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return (
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                App này chưa được cấu hình. Vui lòng liên hệ admin.
              </p>
            </CardContent>
          </Card>
        );
    }
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
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/apps')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách Apps
          </Button>

          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {tool.title}
            </h1>
            {tool.short_description && (
              <p className="text-muted-foreground text-lg">
                {tool.short_description}
              </p>
            )}
          </div>

          {renderAppInterface()}
        </div>
      </main>

      <Footer />
    </div>
  );
}
