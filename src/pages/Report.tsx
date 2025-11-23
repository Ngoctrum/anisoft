import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';

const reportSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự').max(100, 'Tiêu đề không được quá 100 ký tự'),
  message: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự').max(1000, 'Mô tả không được quá 1000 ký tự'),
  screenshot_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  support_type: z.string().min(1, 'Vui lòng chọn loại hỗ trợ'),
});

const supportTypes = [
  { value: 'tool_error', label: '🔧 Tools lỗi' },
  { value: 'website_error', label: '🌐 Website lỗi' },
  { value: 'website_report', label: '📝 Báo cáo website' },
  { value: 'general', label: '💬 Khách (nội dung chung)' },
  { value: 'support_request', label: '🤝 Yêu cầu hỗ trợ/liên kết' },
];

export default function Report() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [tools, setTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState(searchParams.get('tool') || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [supportType, setSupportType] = useState('tool_error');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    const { data } = await supabase
      .from('tools')
      .select('id, title')
      .eq('is_active', true)
      .order('title');

    setTools(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For general inquiries and support requests, tool selection is optional
    const requiresToolSelection = ['tool_error', 'website_error'].includes(supportType);
    
    if (requiresToolSelection && !selectedTool) {
      toast.error('Vui lòng chọn tool/code/website gặp lỗi');
      return;
    }

    try {
      reportSchema.parse({ title, message, screenshot_url: screenshotUrl, support_type: supportType });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setSubmitting(true);

    const { error } = await supabase.from('error_reports').insert({
      user_id: user?.id || null,
      tool_id: selectedTool || null,
      title,
      message,
      screenshot_url: screenshotUrl || null,
      support_type: supportType,
      status: 'pending'
    });

    if (error) {
      toast.error('Gửi báo cáo thất bại');
    } else {
      toast.success('Đã gửi báo cáo. Cảm ơn bạn!');
      setTitle('');
      setMessage('');
      setScreenshotUrl('');
      setSupportType('tool_error');
      setSelectedTool('');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Báo lỗi & Hỗ trợ</h1>
            <p className="text-muted-foreground">
              Gặp vấn đề hoặc cần hỗ trợ? Hãy cho chúng tôi biết
            </p>
          </div>

          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Thông tin yêu cầu</CardTitle>
              <CardDescription>
                Chọn loại hỗ trợ và mô tả chi tiết vấn đề của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="support-type">Loại hỗ trợ <span className="text-destructive">*</span></Label>
                  <Select value={supportType} onValueChange={setSupportType}>
                    <SelectTrigger id="support-type">
                      <SelectValue placeholder="Chọn loại hỗ trợ" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(supportType === 'tool_error' || supportType === 'website_error') && (
                  <div className="space-y-2">
                    <Label htmlFor="tool">
                      {supportType === 'tool_error' ? 'Tool' : 'Website'} gặp lỗi
                      <span className="text-destructive"> *</span>
                    </Label>
                    <Select value={selectedTool} onValueChange={setSelectedTool} required>
                      <SelectTrigger id="tool">
                        <SelectValue placeholder="Chọn mục gặp lỗi" />
                      </SelectTrigger>
                      <SelectContent>
                        {tools.map((tool) => (
                          <SelectItem key={tool.id} value={tool.id}>
                            {tool.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề <span className="text-destructive">*</span></Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Tóm tắt ngắn gọn vấn đề..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mô tả chi tiết <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      supportType === 'general' ? 'Nhập nội dung của bạn...' :
                      supportType === 'support_request' ? 'Mô tả yêu cầu hỗ trợ hoặc liên kết...' :
                      'Mô tả chi tiết lỗi, các bước tái hiện, thông tin hệ thống...'
                    }
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="screenshot">Link ảnh (tùy chọn)</Label>
                  <Input
                    id="screenshot"
                    type="url"
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Tải ảnh lên Imgur, Google Drive hoặc dịch vụ khác và dán link vào đây
                  </p>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Lưu ý:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Mô tả càng chi tiết càng tốt</li>
                        <li>Kèm ảnh chụp màn hình nếu có thể</li>
                        <li>Chúng tôi sẽ xử lý trong 24-48 giờ</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-primary"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi báo cáo'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
