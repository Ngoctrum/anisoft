import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ICONS = ['🖥️','💻','🐧','🪟','🎮','⚡','🚀','🛡️','☁️','🔧','🎨','🌐'];

interface Props {
  open: boolean;
  onClose: () => void;
  config: { os_type: string; networking_type: string; vps_config: string; duration_hours: number };
  onSaved: () => void;
}

export function SaveTemplateDialog({ open, onClose, config, onSaved }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🖥️');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { toast.error('Nhập tên template'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Chưa đăng nhập'); setSaving(false); return; }
    const { error } = await supabase.from('vps_templates').insert({
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      icon,
      ...config,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Đã lưu template');
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Lưu template VPS</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ICONS.map(i => (
                <button key={i} type="button" onClick={() => setIcon(i)}
                  className={`text-2xl p-2 rounded-lg border transition ${icon === i ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Tên *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="VD: My Ubuntu Dev" />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Ghi chú tùy chọn" />
          </div>
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <div>OS: <b>{config.os_type}</b></div>
            <div>Networking: <b>{config.networking_type}</b></div>
            <div>Config: <b>{config.vps_config}</b></div>
            <div>Duration: <b>{config.duration_hours}h</b></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
