import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Download, Loader2 } from 'lucide-react';

export default function Account() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [downloadHistory, setDownloadHistory] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      loadProfile();
      loadDownloadHistory();
    }
  }, [user, authLoading, navigate]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setDisplayName(data.display_name || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url || '');
    }
  };

  const loadDownloadHistory = async () => {
    const { data } = await supabase
      .from('download_history')
      .select(`
        *,
        tools (
          id,
          title,
          slug,
          thumbnail_url
        )
      `)
      .eq('user_id', user?.id)
      .order('downloaded_at', { ascending: false })
      .limit(20);

    setDownloadHistory(data || []);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl
      })
      .eq('id', user?.id);

    if (error) {
      toast.error('Lưu thất bại');
    } else {
      toast.success('Đã lưu thông tin');
      loadProfile();
    }

    setSaving(false);
  };

  if (authLoading) {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-8">Tài khoản của bạn</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Thông tin
            </TabsTrigger>
            <TabsTrigger value="history">
              <Download className="h-4 w-4 mr-2" />
              Lịch sử tải
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>
                  Cập nhật thông tin hiển thị của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Tên đăng nhập</Label>
                    <Input
                      id="username"
                      value={profile?.username || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Không thể thay đổi tên đăng nhập
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Tên hiển thị</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input
                      id="avatarUrl"
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Giới thiệu</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Viết vài dòng về bạn..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" disabled={saving} className="bg-gradient-primary">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử tải xuống</CardTitle>
                <CardDescription>
                  Các tools bạn đã tải gần đây
                </CardDescription>
              </CardHeader>
              <CardContent>
                {downloadHistory.length > 0 ? (
                  <div className="space-y-4">
                    {downloadHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {item.tools?.thumbnail_url ? (
                            <img
                              src={item.tools.thumbnail_url}
                              alt={item.tools.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Download className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.tools?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.downloaded_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/tools/${item.tools?.slug}`)}
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Bạn chưa tải tool nào
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}