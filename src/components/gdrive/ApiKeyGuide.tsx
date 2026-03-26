import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ApiKeyGuide() {
  const { toast } = useToast();

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Đã copy!' });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <HelpCircle className="h-4 w-4" />
          Hướng dẫn lấy API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">Cách lấy Google Drive API Key</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-foreground/90">
          <div className="space-y-2">
            <h3 className="font-semibold text-primary">Bước 1: Truy cập Google Cloud Console</h3>
            <p>Mở trình duyệt và truy cập:</p>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <code className="flex-1 text-xs break-all">https://console.cloud.google.com</code>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyText('https://console.cloud.google.com')}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-muted-foreground">Đăng nhập bằng tài khoản Google của bạn.</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-primary">Bước 2: Tạo Project mới</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Click vào dropdown project ở thanh trên cùng</li>
              <li>Chọn <strong>"New Project"</strong></li>
              <li>Đặt tên bất kỳ (VD: "GDrive Scanner")</li>
              <li>Click <strong>"Create"</strong></li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-primary">Bước 3: Bật Google Drive API</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Vào <strong>APIs & Services → Library</strong></li>
              <li>Tìm kiếm <strong>"Google Drive API"</strong></li>
              <li>Click vào kết quả và nhấn <strong>"Enable"</strong></li>
            </ol>
            <p className="text-muted-foreground">Hoặc truy cập trực tiếp:</p>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <code className="flex-1 text-xs break-all">https://console.cloud.google.com/apis/library/drive.googleapis.com</code>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyText('https://console.cloud.google.com/apis/library/drive.googleapis.com')}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-primary">Bước 4: Tạo API Key</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Vào <strong>APIs & Services → Credentials</strong></li>
              <li>Click <strong>"+ CREATE CREDENTIALS"</strong></li>
              <li>Chọn <strong>"API key"</strong></li>
              <li>API Key sẽ hiện ra — <strong>copy và dán vào ô API Key</strong> ở trang này</li>
            </ol>
          </div>

          <div className="space-y-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
            <h3 className="font-semibold text-primary">💡 Mẹo bảo mật (Tùy chọn)</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>Click <strong>"Restrict Key"</strong> sau khi tạo</li>
              <li>Trong <strong>API restrictions</strong>, chọn <strong>"Restrict key"</strong></li>
              <li>Chỉ chọn <strong>"Google Drive API"</strong></li>
              <li>Điều này giúp key chỉ dùng được cho Drive, an toàn hơn</li>
            </ul>
          </div>

          <div className="space-y-2 bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <h3 className="font-semibold text-destructive">⚠️ Lưu ý quan trọng</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>API Key được lưu trong trình duyệt (localStorage), <strong>không gửi lên server</strong></li>
              <li>Nếu không có API Key, hệ thống sẽ dùng CORS proxy (chậm hơn, ít chính xác)</li>
              <li>API Key miễn phí, Google cho phép ~10,000 request/ngày</li>
            </ul>
          </div>

          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            Mở Google Cloud Console ngay
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
