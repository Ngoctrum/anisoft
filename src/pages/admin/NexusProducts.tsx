import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const empty = {
  id: '',
  slug: '',
  name: '',
  category_slug: '',
  short_description: '',
  description: '',
  image_url: '',
  plans: '[{"name":"1 tháng","price":100000,"duration":"1 tháng"}]',
  badge: '',
  warranty: 'Bảo hành trọn gói',
  is_featured: false,
  is_active: true,
  sort_order: 0,
};

export default function AdminNexusProducts() {
  const [items, setItems] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(empty);

  const load = async () => {
    const [{ data }, { data: c }] = await Promise.all([
      supabase.from('nexus_products').select('*').order('sort_order'),
      supabase.from('nexus_categories').select('*').order('sort_order'),
    ]);
    setItems(data || []);
    setCats(c || []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    let plansObj: any;
    try { plansObj = JSON.parse(editing.plans); } catch { toast.error('Plans JSON không hợp lệ'); return; }

    const payload = { ...editing, plans: plansObj };
    delete payload.id;
    const { error } = editing.id
      ? await supabase.from('nexus_products').update(payload).eq('id', editing.id)
      : await supabase.from('nexus_products').insert(payload);
    if (error) return toast.error(error.message);
    toast.success('Đã lưu');
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa sản phẩm?')) return;
    await supabase.from('nexus_products').delete().eq('id', id);
    load();
  };

  const openEdit = (row?: any) => {
    setEditing(row ? { ...row, plans: JSON.stringify(row.plans, null, 2) } : empty);
    setOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Nexus - Sản phẩm</h1>
        <Button onClick={() => openEdit()} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-1" /> Thêm sản phẩm
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">Tên</th>
              <th className="p-3 text-left">Danh mục</th>
              <th className="p-3 text-left">Gói</th>
              <th className="p-3 text-left">Trạng thái</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="p-3">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-muted-foreground">{i.slug}</div>
                </td>
                <td className="p-3">{i.category_slug}</td>
                <td className="p-3">{(i.plans as any[])?.length || 0} gói</td>
                <td className="p-3">
                  {i.is_active ? '✅' : '❌'} {i.is_featured ? '⭐' : ''}
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing.id ? 'Sửa' : 'Thêm'} sản phẩm</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Slug</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
              <div><Label>Tên</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Danh mục</Label>
                <Select value={editing.category_slug} onValueChange={(v) => setEditing({ ...editing, category_slug: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>{cats.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Badge (HOT/SALE/…)</Label><Input value={editing.badge || ''} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} /></div>
            </div>
            <div><Label>Mô tả ngắn</Label><Input value={editing.short_description || ''} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} /></div>
            <div><Label>Ảnh (URL)</Label><Input value={editing.image_url || ''} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></div>
            <div><Label>Mô tả chi tiết</Label><Textarea rows={4} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div>
              <Label>Plans (JSON)</Label>
              <Textarea rows={6} className="font-mono text-xs" value={editing.plans} onChange={(e) => setEditing({ ...editing, plans: e.target.value })} />
            </div>
            <div><Label>Bảo hành</Label><Input value={editing.warranty || ''} onChange={(e) => setEditing({ ...editing, warranty: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Thứ tự</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center justify-between pt-6"><Label>Nổi bật</Label><Switch checked={editing.is_featured} onCheckedChange={(v) => setEditing({ ...editing, is_featured: v })} /></div>
              <div className="flex items-center justify-between pt-6"><Label>Hiển thị</Label><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /></div>
            </div>
            <Button onClick={save} className="w-full bg-gradient-primary">Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
