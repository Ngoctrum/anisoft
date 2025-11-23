import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Archive, Shield, HelpCircle } from 'lucide-react';

export default function Docs() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Hướng dẫn sử dụng</h1>
            <p className="text-xl text-muted-foreground">
              Tài liệu hướng dẫn chi tiết về cách sử dụng Ani Studio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Cách tải tool</CardTitle>
                <CardDescription>
                  Hướng dẫn tải xuống và sử dụng tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>1. Tìm kiếm tool bạn muốn tải</p>
                <p>2. Nhấn vào tool để xem chi tiết</p>
                <p>3. Nhấn nút "Tải xuống"</p>
                <p>4. Đợi countdown 5 giây</p>
                <p>5. File sẽ tự động tải về</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Archive className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Giải nén file</CardTitle>
                <CardDescription>
                  Hướng dẫn xử lý file nén
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• File .zip: Dùng WinRAR, 7-Zip hoặc công cụ tích hợp</p>
                <p>• File .rar: Cần WinRAR hoặc 7-Zip</p>
                <p>• File .7z: Dùng 7-Zip</p>
                <p>• Giải nén vào thư mục riêng để dễ quản lý</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Sử dụng code</CardTitle>
                <CardDescription>
                  Hướng dẫn chạy code đã tải
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Đọc file README.md nếu có</p>
                <p>• Kiểm tra yêu cầu hệ thống</p>
                <p>• Cài đặt dependencies cần thiết</p>
                <p>• Chạy theo hướng dẫn trong file</p>
                <p>• Tham khảo documentation đi kèm</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Bảo mật</CardTitle>
                <CardDescription>
                  Lưu ý về an toàn khi sử dụng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Scan virus trước khi chạy</p>
                <p>• Không chạy file .exe từ nguồn không rõ</p>
                <p>• Backup dữ liệu quan trọng</p>
                <p>• Đọc kỹ mô tả và đánh giá</p>
                <p>• Báo lỗi nếu phát hiện vấn đề</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Câu hỏi thường gặp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Tool không hoạt động?</h3>
                <p className="text-sm text-muted-foreground">
                  Kiểm tra lại yêu cầu hệ thống, đọc hướng dẫn cài đặt và đảm bảo đã cài đủ dependencies. Nếu vẫn lỗi, hãy báo lỗi qua trang Report.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Làm sao để tải nhiều tools cùng lúc?</h3>
                <p className="text-sm text-muted-foreground">
                  Mỗi tool cần tải riêng qua trang download của nó. Bạn có thể mở nhiều tab để tải song song.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Link tải hết hạn?</h3>
                <p className="text-sm text-muted-foreground">
                  Liên hệ admin qua trang Hỗ trợ để cập nhật link mới hoặc báo lỗi trực tiếp trên trang tool.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}