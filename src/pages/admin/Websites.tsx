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
import { Plus, Pencil, Trash2, Eye, Loader2, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminWebsites() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    thumbnail_url: '',
    download_url: '',
    tags: '',
    is_active: true,
    is_featured: false,
    status_badge: '',
  });

  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tools')
      .select('*')
      .eq('category', 'website')
      .order('created_at', { ascending: false });

    setWebsites(data || []);
    setLoading(false);
  };

  const handleOpenDialog = (website?: any) => {
    if (website) {
      setEditingWebsite(website);
      setFormData({
        title: website.title,
        slug: website.slug,
        short_description: website.short_description || '',
        description: website.description || '',
        thumbnail_url: website.thumbnail_url || '',
        download_url: website.download_url,
        tags: website.tags?.join(', ') || '',
        is_active: website.is_active,
        is_featured: website.is_featured,
        status_badge: website.status_badge || '',
      });
    } else {
      setEditingWebsite(null);
      setFormData({
        title: '',
        slug: '',
        short_description: '',
        description: '',
        thumbnail_url: '',
        download_url: '',
        tags: '',
        is_active: true,
        is_featured: false,
        status_badge: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const tagsArray = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    const websiteData = {
      title: formData.title,
      slug: formData.slug,
      short_description: formData.short_description,
      description: formData.description,
      thumbnail_url: formData.thumbnail_url,
      download_url: formData.download_url,
      category: 'website',
      tags: tagsArray,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      status_badge: formData.status_badge || null,
    };

    try {
      if (editingWebsite) {
        const { error } = await supabase
          .from('tools')
          .update(websiteData)
          .eq('id', editingWebsite.id);

        if (error) throw error;
        toast.success('Đã cập nhật website');
      } else {
        const { error } = await supabase
          .from('tools')
          .insert(websiteData);

        if (error) throw error;
        toast.success('Đã thêm website mới');
      }

      setDialogOpen(false);
      loadWebsites();
    } catch (error: any) {
      toast.error(error.message);
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa website này?')) return;

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Xóa thất bại');
    } else {
      toast.success('Đã xóa website');
      loadWebsites();
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
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              Quản lý Website Templates
            </h1>
            <p className="text-muted-foreground">
              Thêm, sửa, xóa các website templates trên hệ thống
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Thêm Website
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingWebsite ? 'Chỉnh sửa Website' : 'Thêm Website mới'}
                </DialogTitle>
                <DialogDescription>
                  Điền đầy đủ thông tin website template
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tên website *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Mô tả ngắn</Label>
                  <Input
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả chi tiết</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail_url">URL ảnh thumbnail</Label>
                  <Input
                    id="thumbnail_url"
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="download_url">URL tải xuống *</Label>
                  <Input
                    id="download_url"
                    type="url"
                    value={formData.download_url}
                    onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (phân cách bằng dấu ,)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="responsive, landing-page, ecommerce"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status-badge">Tag trạng thái</Label>
                  <Select value={formData.status_badge || 'none'} onValueChange={(value) => setFormData({ ...formData, status_badge: value === 'none' ? '' : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tag (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có</SelectItem>
                      <SelectItem value="new">🆕 Mới</SelectItem>
                      <SelectItem value="updated">🔄 Cập nhật</SelectItem>
                      <SelectItem value="hot">🔥 Hot</SelectItem>
                      <SelectItem value="popular">⭐ Phổ biến</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Kích hoạt</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label htmlFor="is_featured">Nổi bật</Label>
                  </div>
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
            {websites.map((website) => (
              <Card key={website.id} className="bg-gradient-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {website.thumbnail_url ? (
                        <img src={website.thumbnail_url} alt={website.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Globe className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{website.title}</h3>
                          <p className="text-sm text-muted-foreground">{website.short_description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(website)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(website.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Website</Badge>
                        {website.status_badge && (
                          <Badge className={getBadgeStyle(website.status_badge)}>
                            {website.status_badge === 'new' ? '🆕 Mới' :
                             website.status_badge === 'updated' ? '🔄 Cập nhật' :
                             website.status_badge === 'hot' ? '🔥 Hot' :
                             website.status_badge === 'popular' ? '⭐ Phổ biến' : website.status_badge}
                          </Badge>
                        )}
                        {website.is_featured && <Badge className="bg-accent">Nổi bật</Badge>}
                        {!website.is_active && <Badge variant="destructive">Đã ẩn</Badge>}
                        {website.tags?.map((tag: string) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {website.total_downloads} lượt tải
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
