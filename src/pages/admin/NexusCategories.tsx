import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const empty = { id: '', slug: '', name: '', icon: '', sort_order: 0, is_active: true };

export default function AdminNexusCategories() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(empty);

  const load = async () => {
    const { data } = await supabase.from('nexus_categories').select('*').order('sort_order');
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = { ...editing };
    delete payload.id;
    const { error } = editing.id
      ? await supabase.from('nexus_categories').update(payload).eq('id', editing.id)
      : await supabase.from('nexus_categories').insert(payload);
    if (error) return toast.error(error.message);
    toast.success('Đã lưu');
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa danh mục?')) return;
    const { error } = await supabase.from('nexus_categories').delete().eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Nexus - Danh mục</h1>
        <Button onClick={() => { setEditing(empty); setOpen(true); }} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-1" /> Thêm
        </Button>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr>
            <th className="p-3 text-left">Slug</th><th className="p-3 text-left">Tên</th><th className="p-3">Thứ tự</th><th className="p-3">Bật</th><th></th>
          </tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="p-3">{i.slug}</td>
                <td className="p-3">{i.name}</td>
                <td className="p-3 text-center">{i.sort_order}</td>
                <td className="p-3 text-center">{i.is_active ? '✅' : '❌'}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(i); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing.id ? 'Sửa' : 'Thêm'} danh mục</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Slug</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
            <div><Label>Tên</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><Label>Icon (lucide name)</Label><Input value={editing.icon || ''} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} /></div>
            <div><Label>Thứ tự</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} /></div>
            <div className="flex items-center justify-between"><Label>Hiển thị</Label><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /></div>
            <Button onClick={save} className="w-full bg-gradient-primary">Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
