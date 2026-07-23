import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EVENTS = [
  { id: 'ready', label: 'VPS sẵn sàng' },
  { id: 'expiring', label: 'Sắp hết hạn (còn 10 phút)' },
  { id: 'error', label: 'Gặp lỗi' },
  { id: 'killed', label: 'Bị tắt / xóa' },
];

interface Props { open: boolean; onClose: () => void; onSaved: () => void; }

export function NotificationChannelForm({ open, onClose, onSaved }: Props) {
  const [type, setType] = useState<'telegram' | 'discord' | 'webhook' | 'email'>('telegram');
  const [name, setName] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<string[]>(['ready', 'expiring', 'error']);
  const [saving, setSaving] = useState(false);

  const toggleEvent = (id: string) => {
    setEvents(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const save = async () => {
    if (!name.trim()) { toast.error('Nhập tên kênh'); return; }
    if (type === 'telegram' && (!config.bot_token || !config.chat_id)) { toast.error('Nhập Bot Token và Chat ID'); return; }
    if (type === 'discord' && !config.webhook_url) { toast.error('Nhập Discord Webhook URL'); return; }
    if (type === 'webhook' && !config.url) { toast.error('Nhập Webhook URL'); return; }
    if (type === 'email' && !config.email) { toast.error('Nhập Email'); return; }
    if (events.length === 0) { toast.error('Chọn ít nhất 1 sự kiện'); return; }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Chưa đăng nhập'); setSaving(false); return; }
    const { error } = await supabase.from('notification_channels').insert({
      user_id: user.id, name: name.trim(), type, config, events, enabled: true,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Đã thêm kênh');
    onSaved(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Thêm kênh thông báo</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div>
            <Label>Loại kênh</Label>
            <Select value={type} onValueChange={(v: any) => { setType(v); setConfig({}); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="telegram">Telegram Bot</SelectItem>
                <SelectItem value="discord">Discord Webhook</SelectItem>
                <SelectItem value="webhook">Custom Webhook (HTTP POST)</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tên kênh *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Telegram cá nhân" />
          </div>

          {type === 'telegram' && (
            <>
              <div>
                <Label>Bot Token *</Label>
                <Input type="password" value={config.bot_token || ''} onChange={e => setConfig({ ...config, bot_token: e.target.value })} placeholder="123456:ABC-DEF..." />
                <p className="text-xs text-muted-foreground mt-1">Tạo bot tại @BotFather</p>
              </div>
              <div>
                <Label>Chat ID *</Label>
                <Input value={config.chat_id || ''} onChange={e => setConfig({ ...config, chat_id: e.target.value })} placeholder="123456789" />
                <p className="text-xs text-muted-foreground mt-1">Lấy từ @userinfobot</p>
              </div>
            </>
          )}
          {type === 'discord' && (
            <div>
              <Label>Webhook URL *</Label>
              <Input value={config.webhook_url || ''} onChange={e => setConfig({ ...config, webhook_url: e.target.value })} placeholder="https://discord.com/api/webhooks/..." />
            </div>
          )}
          {type === 'webhook' && (
            <div>
              <Label>URL *</Label>
              <Input value={config.url || ''} onChange={e => setConfig({ ...config, url: e.target.value })} placeholder="https://your-endpoint.com/hook" />
              <p className="text-xs text-muted-foreground mt-1">Sẽ nhận POST JSON với event, sessionId, message</p>
            </div>
          )}
          {type === 'email' && (
            <div>
              <Label>Email *</Label>
              <Input type="email" value={config.email || ''} onChange={e => setConfig({ ...config, email: e.target.value })} placeholder="you@example.com" />
              <p className="text-xs text-muted-foreground mt-1">Cần cấu hình email domain trong Cloud → Emails</p>
            </div>
          )}

          <div>
            <Label>Nhận thông báo khi</Label>
            <div className="space-y-2 mt-2">
              {EVENTS.map(e => (
                <label key={e.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={events.includes(e.id)} onCheckedChange={() => toggleEvent(e.id)} />
                  <span className="text-sm">{e.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Thêm'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
