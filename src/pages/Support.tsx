import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Facebook, Youtube, Mail, MessageCircle } from 'lucide-react';

export default function Support() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Hỗ trợ</h1>
            <p className="text-xl text-muted-foreground">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-card border-border hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Facebook className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle>Facebook</CardTitle>
                <CardDescription>
                  Liên hệ qua Facebook Page hoặc Group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                    Mở Facebook
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                  <Youtube className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle>YouTube</CardTitle>
                <CardDescription>
                  Video hướng dẫn và tutorials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                    Mở YouTube
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Email</CardTitle>
                <CardDescription>
                  Gửi email cho chúng tôi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:contact@anistudio.com">
                    Gửi Email
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle>Zalo</CardTitle>
                <CardDescription>
                  Chat trực tiếp qua Zalo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <a href="https://zalo.me" target="_blank" rel="noopener noreferrer">
                    Mở Zalo
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Thời gian hỗ trợ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <strong>Thứ 2 - Thứ 6:</strong> 9:00 - 18:00
              </p>
              <p className="text-sm">
                <strong>Thứ 7 - Chủ nhật:</strong> 9:00 - 17:00
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}