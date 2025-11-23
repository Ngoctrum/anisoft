import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Settings as SettingsIcon, Download, Link, Palette } from 'lucide-react';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [general, setGeneral] = useState<any>({});
  const [download, setDownload] = useState<any>({});
  const [contact, setContact] = useState<any>({});
  const [theme, setTheme] = useState<any>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from('site_settings')
      .select('*');

    data?.forEach((setting) => {
      const value = setting.value as any;
      switch (setting.key) {
        case 'general':
          setGeneral(value);
          break;
        case 'download':
          setDownload(value);
          break;
        case 'contact':
          setContact(value);
          break;
        case 'theme':
          setTheme(value);
          break;
      }
    });

    setLoading(false);
  };

  const handleSave = async (key: string, value: any) => {
    setSaving(true);

    const { error } = await supabase
      .from('site_settings')
      .update({ value })
      .eq('key', key);

    if (error) {
      toast.error('Lưu thất bại');
    } else {
      toast.success('Đã lưu cài đặt');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">
            Cấu hình các thông số của website
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Chung
            </TabsTrigger>
            <TabsTrigger value="download">
              <Download className="h-4 w-4 mr-2" />
              Tải xuống
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Link className="h-4 w-4 mr-2" />
              Liên hệ
            </TabsTrigger>
            <TabsTrigger value="theme">
              <Palette className="h-4 w-4 mr-2" />
              Giao diện
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt chung</CardTitle>
                <CardDescription>
                  Thông tin cơ bản về website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Tên website</Label>
                  <Input
                    id="site_name"
                    value={general.site_name || ''}
                    onChange={(e) => setGeneral({ ...general, site_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site_slogan">Slogan</Label>
                  <Input
                    id="site_slogan"
                    value={general.site_slogan || ''}
                    onChange={(e) => setGeneral({ ...general, site_slogan: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site_description_seo">Mô tả SEO</Label>
                  <Textarea
                    id="site_description_seo"
                    value={general.site_description_seo || ''}
                    onChange={(e) => setGeneral({ ...general, site_description_seo: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cho phép đăng ký</Label>
                    <p className="text-sm text-muted-foreground">Người dùng có thể tạo tài khoản mới</p>
                  </div>
                  <Switch
                    checked={general.is_registration_enabled}
                    onCheckedChange={(checked) => setGeneral({ ...general, is_registration_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Chế độ bảo trì</Label>
                    <p className="text-sm text-muted-foreground">Tạm khóa website để bảo trì</p>
                  </div>
                  <Switch
                    checked={general.is_site_maintenance}
                    onCheckedChange={(checked) => setGeneral({ ...general, is_site_maintenance: checked })}
                  />
                </div>

                <Button
                  onClick={() => handleSave('general', general)}
                  disabled={saving}
                  className="bg-gradient-primary"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="download">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt tải xuống</CardTitle>
                <CardDescription>
                  Cấu hình trang download
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="countdown">Thời gian countdown (giây)</Label>
                  <Input
                    id="countdown"
                    type="number"
                    value={download.download_countdown_seconds || 5}
                    onChange={(e) => setDownload({ ...download, download_countdown_seconds: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warning_text">Text cảnh báo</Label>
                  <Textarea
                    id="warning_text"
                    value={download.download_warning_text || ''}
                    onChange={(e) => setDownload({ ...download, download_warning_text: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lưu lịch sử tải</Label>
                    <p className="text-sm text-muted-foreground">Ghi lại lượt tải của user</p>
                  </div>
                  <Switch
                    checked={download.enable_download_history}
                    onCheckedChange={(checked) => setDownload({ ...download, enable_download_history: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tự động chuyển hướng</Label>
                    <p className="text-sm text-muted-foreground">Tự động redirect sau countdown</p>
                  </div>
                  <Switch
                    checked={download.enable_auto_redirect}
                    onCheckedChange={(checked) => setDownload({ ...download, enable_auto_redirect: checked })}
                  />
                </div>

                <Button
                  onClick={() => handleSave('download', download)}
                  disabled={saving}
                  className="bg-gradient-primary"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
                <CardDescription>
                  Các kênh liên hệ và hỗ trợ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email liên hệ</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={contact.contact_email || ''}
                    onChange={(e) => setContact({ ...contact, contact_email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook_url">Facebook URL</Label>
                  <Input
                    id="facebook_url"
                    type="url"
                    value={contact.facebook_url || ''}
                    onChange={(e) => setContact({ ...contact, facebook_url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube_url">YouTube URL</Label>
                  <Input
                    id="youtube_url"
                    type="url"
                    value={contact.youtube_url || ''}
                    onChange={(e) => setContact({ ...contact, youtube_url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zalo_url">Zalo URL</Label>
                  <Input
                    id="zalo_url"
                    type="url"
                    value={contact.zalo_url || ''}
                    onChange={(e) => setContact({ ...contact, zalo_url: e.target.value })}
                  />
                </div>

                <Button
                  onClick={() => handleSave('contact', contact)}
                  disabled={saving}
                  className="bg-gradient-primary"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle>Giao diện</CardTitle>
                <CardDescription>
                  Tùy chỉnh màu sắc và theme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Tính năng đang phát triển
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}