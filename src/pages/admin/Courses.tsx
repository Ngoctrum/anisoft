import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, BookOpen, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    redirect_url: '',
    status_badge: '',
    is_active: true,
    is_premium: false,
    price: '',
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tools')
      .select('*')
      .eq('tool_type', 'course')
      .order('created_at', { ascending: false });

    setCourses(data || []);
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

  const handleOpenDialog = (course?: any) => {
    if (course) {
      setEditingCourse(course);
      const coursePrice = course.app_config?.price || 0;
      setFormData({
        title: course.title,
        redirect_url: course.download_url || '',
        status_badge: course.status_badge || '',
        is_active: course.is_active,
        is_premium: course.is_premium || false,
        price: coursePrice > 0 ? String(coursePrice) : '',
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        redirect_url: '',
        status_badge: '',
        is_active: true,
        is_premium: false,
        price: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const slug = generateSlug(formData.title);
    const priceValue = formData.is_premium && formData.price ? parseInt(formData.price) : 0;

    const courseData = {
      title: formData.title,
      slug: editingCourse ? editingCourse.slug : slug,
      short_description: '',
      description: '',
      thumbnail_url: '',
      download_url: formData.redirect_url,
      category: 'courses',
      tags: [],
      is_active: formData.is_active,
      is_featured: false,
      is_premium: formData.is_premium,
      status_badge: formData.status_badge || null,
      tool_type: 'course',
      app_config: {
        price: priceValue,
      },
    };

    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('tools')
          .update(courseData)
          .eq('id', editingCourse.id);

        if (error) throw error;
        toast.success('Đã cập nhật khóa học', {
          description: `Khóa học "${formData.title}" đã được cập nhật thành công`
        });
      } else {
        const { error } = await supabase
          .from('tools')
          .insert(courseData);

        if (error) throw error;
        toast.success('Đã thêm khóa học mới', {
          description: `Khóa học "${formData.title}" đã được thêm vào hệ thống`
        });
      }

      setDialogOpen(false);
      loadCourses();
    } catch (error: any) {
      toast.error('Có lỗi xảy ra', {
        description: error.message
      });
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa khóa học này?')) return;

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Xóa thất bại', {
        description: error.message
      });
    } else {
      toast.success('Đã xóa khóa học', {
        description: 'Khóa học đã được xóa khỏi hệ thống'
      });
      loadCourses();
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
              <BookOpen className="h-8 w-8 text-primary" />
              Quản lý Khóa học
            </h1>
            <p className="text-muted-foreground">
              Thêm, sửa, xóa các khóa học trên hệ thống
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Thêm Khóa học
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? 'Chỉnh sửa Khóa học' : 'Thêm Khóa học mới'}
                </DialogTitle>
                <DialogDescription>
                  Điền đầy đủ thông tin khóa học
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Tên khóa học *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ví dụ: Khóa học React từ cơ bản đến nâng cao"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redirect_url">URL khóa học *</Label>
                  <Input
                    id="redirect_url"
                    type="url"
                    value={formData.redirect_url}
                    onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                    placeholder="https://khoahoc-cua-ban.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL của trang khóa học hoặc nền tảng học
                  </p>
                </div>

                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_premium"
                      checked={formData.is_premium}
                      onCheckedChange={(checked) => {
                        setFormData({ ...formData, is_premium: checked, price: checked ? formData.price : '' });
                      }}
                    />
                    <Label htmlFor="is_premium" className="font-semibold">
                      Khóa học có phí
                    </Label>
                  </div>

                  {formData.is_premium && (
                    <div className="space-y-2">
                      <Label htmlFor="price">Giá khóa học (nghìn đồng) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="10"
                          className="pl-9"
                          required={formData.is_premium}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ví dụ: nhập <strong>10</strong> = 10.000đ, nhập <strong>20</strong> = 20.000đ
                      </p>
                      {formData.price && (
                        <div className="text-sm font-medium text-primary">
                          Giá hiển thị: {parseInt(formData.price).toLocaleString('vi-VN')}đ
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status-badge">Trạng thái</Label>
                  <Select value={formData.status_badge || 'none'} onValueChange={(value) => setFormData({ ...formData, status_badge: value === 'none' ? '' : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Không có" />
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
            {courses.map((course) => {
              const coursePrice = course.app_config?.price || 0;
              return (
                <Card key={course.id} className="bg-gradient-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{course.title}</h3>
                            {course.is_premium && coursePrice > 0 && (
                              <p className="text-sm font-medium text-primary">
                                💰 {coursePrice.toLocaleString('vi-VN')}đ
                              </p>
                            )}
                            {!course.is_premium && (
                              <p className="text-sm font-medium text-green-500">
                                🎁 Miễn phí
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(course)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(course.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{course.category}</Badge>
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                            📚 Khóa học
                          </Badge>
                          {course.is_premium ? (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                              💎 Có phí
                            </Badge>
                          ) : (
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                              🎁 Miễn phí
                            </Badge>
                          )}
                          {course.download_url && (
                            <Badge variant="outline" className="max-w-[200px] truncate">
                              {new URL(course.download_url).hostname}
                            </Badge>
                          )}
                          {course.status_badge && (
                            <Badge className={getBadgeStyle(course.status_badge)}>
                              {course.status_badge === 'new' ? '🆕 Mới' :
                               course.status_badge === 'updated' ? '🔄 Cập nhật' :
                               course.status_badge === 'hot' ? '🔥 Hot' :
                               course.status_badge === 'popular' ? '⭐ Phổ biến' : course.status_badge}
                            </Badge>
                          )}
                          {!course.is_active && <Badge variant="destructive">Đã ẩn</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
