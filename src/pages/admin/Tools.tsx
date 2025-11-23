import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminTools() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    thumbnail_url: '',
    download_url: '',
    category: 'tool',
    tags: '',
    is_active: true,
    is_featured: false,
    status_badge: '',
  });

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tools')
      .select('*')
      .order('created_at', { ascending: false });

    setTools(data || []);
    setLoading(false);
  };

  const handleOpenDialog = (tool?: any) => {
    if (tool) {
      setEditingTool(tool);
      setFormData({
        title: tool.title,
        slug: tool.slug,
        short_description: tool.short_description || '',
        description: tool.description || '',
        thumbnail_url: tool.thumbnail_url || '',
        download_url: tool.download_url,
        category: tool.category,
        tags: tool.tags?.join(', ') || '',
        is_active: tool.is_active,
        is_featured: tool.is_featured,
        status_badge: tool.status_badge || '',
      });
    } else {
      setEditingTool(null);
      setFormData({
        title: '',
        slug: '',
        short_description: '',
        description: '',
        thumbnail_url: '',
        download_url: '',
        category: 'tool',
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

    const toolData = {
      title: formData.title,
      slug: formData.slug,
      short_description: formData.short_description,
      description: formData.description,
      thumbnail_url: formData.thumbnail_url,
      download_url: formData.download_url,
      category: formData.category,
      tags: tagsArray,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      status_badge: formData.status_badge || null,
    };

    try {
      if (editingTool) {
        const { error } = await supabase
          .from('tools')
          .update(toolData)
          .eq('id', editingTool.id);

        if (error) throw error;
        toast.success('Đã cập nhật tool', {
          description: `Tool "${formData.title}" đã được cập nhật thành công`
        });
      } else {
        const { error } = await supabase
          .from('tools')
          .insert(toolData);

        if (error) throw error;
        toast.success('Đã thêm tool mới', {
          description: `Tool "${formData.title}" đã được thêm vào hệ thống`
        });
      }

      setDialogOpen(false);
      loadTools();
    } catch (error: any) {
      toast.error('Có lỗi xảy ra', {
        description: error.message
      });
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tool này?')) return;

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Xóa thất bại', {
        description: error.message
      });
    } else {
      toast.success('Đã xóa tool', {
        description: 'Tool đã được xóa khỏi hệ thống'
      });
      loadTools();
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
            <h1 className="text-3xl font-bold">Quản lý Tools</h1>
            <p className="text-muted-foreground">
              Thêm, sửa, xóa các tools trên hệ thống
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Thêm Tool
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTool ? 'Chỉnh sửa Tool' : 'Thêm Tool mới'}
                </DialogTitle>
                <DialogDescription>
                  Điền đầy đủ thông tin tool
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tên tool *</Label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Danh mục</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tool">Tool</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (phân cách bằng dấu ,)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="react, nodejs, api"
                    />
                  </div>
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
                  <p className="text-xs text-muted-foreground">
                    Tag sẽ hiển thị nổi bật trên card
                  </p>
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
            {tools.map((tool) => (
              <Card key={tool.id} className="bg-gradient-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {tool.thumbnail_url ? (
                        <img src={tool.thumbnail_url} alt={tool.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Eye className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{tool.title}</h3>
                          <p className="text-sm text-muted-foreground">{tool.short_description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(tool)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(tool.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{tool.category}</Badge>
                        {tool.status_badge && (
                          <Badge className={getBadgeStyle(tool.status_badge)}>
                            {tool.status_badge === 'new' ? '🆕 Mới' :
                             tool.status_badge === 'updated' ? '🔄 Cập nhật' :
                             tool.status_badge === 'hot' ? '🔥 Hot' :
                             tool.status_badge === 'popular' ? '⭐ Phổ biến' : tool.status_badge}
                          </Badge>
                        )}
                        {tool.is_featured && <Badge className="bg-accent">Nổi bật</Badge>}
                        {!tool.is_active && <Badge variant="destructive">Đã ẩn</Badge>}
                        {tool.tags?.map((tag: string) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {tool.total_downloads} lượt tải
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
