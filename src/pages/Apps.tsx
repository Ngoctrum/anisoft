import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Download, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Tool {
  id: string;
  title: string;
  short_description: string;
  app_config: any;
  tool_type: string;
}

export default function Apps() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Image Generator State
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string>('');

  useEffect(() => {
    loadInteractiveTools();
  }, []);

  const loadInteractiveTools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tools')
      .select('id, title, short_description, app_config, tool_type')
      .eq('tool_type', 'interactive')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTools(data);
      if (data.length > 0) {
        setSelectedTool(data[0].id);
      }
    }
    setLoading(false);
  };

  const currentTool = tools.find(t => t.id === selectedTool);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập mô tả ảnh');
      return;
    }

    setGenerating(true);
    setGeneratedImage('');

    try {
      // Simulate AI image generation (you can integrate real AI API here)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo: use placeholder
      const demoImage = `https://picsum.photos/seed/${Date.now()}/512/512`;
      setGeneratedImage(demoImage);
      
      toast.success('Đã tạo ảnh thành công!');
    } catch (error: any) {
      toast.error('Lỗi khi tạo ảnh', {
        description: error.message
      });
    } finally {
      setGenerating(false);
    }
  };

  const renderAppInterface = () => {
    if (!currentTool) return null;

    const appType = currentTool.app_config?.type;

    switch (appType) {
      case 'image-generator':
        return (
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
                  placeholder="Ví dụ: một chú mèo đang ngồi trên mặt trăng, phong cách anime..."
                  rows={4}
                  disabled={generating}
                />
              </div>

              <Button 
                onClick={handleGenerateImage} 
                disabled={generating || !prompt.trim()}
                className="w-full bg-gradient-primary"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo ảnh...
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
                  <div className="relative rounded-lg overflow-hidden border-2 border-primary/20">
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
                      onClick={() => window.open(generatedImage, '_blank')}
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

  return (
    <div className="min-h-screen bg-gradient-radial flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Phần Mềm Online
            </h1>
            <p className="text-muted-foreground">
              Sử dụng các công cụ mạnh mẽ ngay trên trình duyệt
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
          ) : tools.length === 0 ? (
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  Chưa có phần mềm nào. Quay lại sau nhé!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="tool-select">Chọn phần mềm</Label>
                <Select value={selectedTool} onValueChange={setSelectedTool}>
                  <SelectTrigger id="tool-select" className="w-full">
                    <SelectValue placeholder="Chọn một công cụ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tools.map((tool) => (
                      <SelectItem key={tool.id} value={tool.id}>
                        {tool.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentTool && (
                  <p className="text-sm text-muted-foreground">
                    {currentTool.short_description}
                  </p>
                )}
              </div>

              {renderAppInterface()}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
