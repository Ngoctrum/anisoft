import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminApps() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    redirect_url: '',
    is_active: true,
  });

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tools')
      .select('*')
      .eq('tool_type', 'interactive')
      .order('created_at', { ascending: false });

    setApps(data || []);
    setLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  const handleOpenDialog = (app?: any) => {
    if (app) {
      setEditingApp(app);
      setFormData({
        title: app.title,
        redirect_url: app.download_url || '',
        is_active: app.is_active,
      });
    } else {
      setEditingApp(null);
      setFormData({
        title: '',
        redirect_url: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const slug = generateSlug(formData.title);

    const appData = {
      title: formData.title,
      slug: editingApp ? editingApp.slug : slug,
      short_description: '',
      description: '',
      thumbnail_url: '',
      download_url: formData.redirect_url,
      category: 'tool',
      tags: [],
      is_active: formData.is_active,
      is_featured: false,
      status_badge: null,
      tool_type: 'interactive',
      app_config: {},
    };

    try {
      if (editingApp) {
        const { error } = await supabase
          .from('tools')
          .update(appData)
          .eq('id', editingApp.id);

        if (error) throw error;
        toast.success('Đã cập nhật app', {
          description: `App "${formData.title}" đã được cập nhật thành công`
        });
      } else {
        const { error } = await supabase
          .from('tools')
          .insert(appData);

        if (error) throw error;
        toast.success('Đã thêm app mới', {
          description: `App "${formData.title}" đã được thêm vào hệ thống`
        });
      }

      setDialogOpen(false);
      loadApps();
    } catch (error: any) {
      toast.error('Có lỗi xảy ra', {
        description: error.message
      });
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa app này?')) return;

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Xóa thất bại', {
        description: error.message
      });
    } else {
      toast.success('Đã xóa app', {
        description: 'App đã được xóa khỏi hệ thống'
      });
      loadApps();
    }
  };

  const getBadgeStyle = (badge: string) => {
    const styles: Record<string, string> = {
      new: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
      updated: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
      hot: "bg-gradient-to-r from-red-500 to-orange-500 text-white",
      popular: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
    };
    return styles[badge.toLowerCase()] || "bg-primary text-primary-foreground";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Quản lý Apps
            </h1>
            <p className="text-muted-foreground">
              Thêm, sửa, xóa các ứng dụng web tương tác
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Thêm App
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingApp ? 'Chỉnh sửa App' : 'Thêm App mới'}
                </DialogTitle>
                <DialogDescription>
                  Điền đầy đủ thông tin ứng dụng tương tác
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Tên app *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ví dụ: Tools chỉnh ảnh"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redirect_url">URL chuyển hướng *</Label>
                  <Input
                    id="redirect_url"
                    type="url"
                    value={formData.redirect_url}
                    onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                    placeholder="https://tool-cua-ban.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL của tool/website bên ngoài mà bạn muốn chuyển hướng đến
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Kích hoạt</Label>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={submitting} className="bg-gradient-primary">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {apps.map((app) => (
              <Card key={app.id} className="bg-gradient-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {app.thumbnail_url ? (
                        <img src={app.thumbnail_url} alt={app.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{app.title}</h3>
                          <p className="text-sm text-muted-foreground">{app.short_description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(app)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(app.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{app.category}</Badge>
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          ⚡ Redirect
                        </Badge>
                        {app.download_url && (
                          <Badge variant="outline" className="max-w-[200px] truncate">
                            {new URL(app.download_url).hostname}
                          </Badge>
                        )}
                        {app.status_badge && (
                          <Badge className={getBadgeStyle(app.status_badge)}>
                            {app.status_badge === 'new' ? '🆕 Mới' :
                             app.status_badge === 'updated' ? '🔄 Cập nhật' :
                             app.status_badge === 'hot' ? '🔥 Hot' :
                             app.status_badge === 'popular' ? '⭐ Phổ biến' : app.status_badge}
                          </Badge>
                        )}
                        {app.is_featured && <Badge className="bg-accent">Nổi bật</Badge>}
                        {!app.is_active && <Badge variant="destructive">Đã ẩn</Badge>}
                        {app.tags?.map((tag: string) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
