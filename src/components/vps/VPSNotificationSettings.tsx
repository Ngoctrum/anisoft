import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Bell, Plus, Trash2, Send, Loader2, MessageCircle, Webhook, Mail } from 'lucide-react';
import { NotificationChannelForm } from './NotificationChannelForm';

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'telegram' | 'discord' | 'webhook' | 'email';
  config: Record<string, string>;
  events: string[];
  enabled: boolean;
}

const TYPE_META = {
  telegram: { label: 'Telegram', icon: MessageCircle, color: 'text-sky-500' },
  discord: { label: 'Discord', icon: MessageCircle, color: 'text-indigo-500' },
  webhook: { label: 'Webhook', icon: Webhook, color: 'text-orange-500' },
  email: { label: 'Email', icon: Mail, color: 'text-emerald-500' },
};

export function VPSNotificationSettings() {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('notification_channels').select('*').order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setChannels((data || []) as NotificationChannel[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (c: NotificationChannel) => {
    const { error } = await supabase.from('notification_channels').update({ enabled: !c.enabled }).eq('id', c.id);
    if (error) toast.error(error.message); else load();
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa kênh thông báo này?')) return;
    const { error } = await supabase.from('notification_channels').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Đã xóa'); load(); }
  };

  const test = async (c: NotificationChannel) => {
    setTesting(c.id);
    try {
      const { error } = await supabase.functions.invoke('send-vps-notification', {
        body: { channelId: c.id, test: true },
      });
      if (error) throw error;
      toast.success('Đã gửi tin nhắn thử — kiểm tra kênh của bạn');
    } catch (e: any) {
      toast.error('Test thất bại: ' + (e.message || 'unknown'));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-primary" /> Thông báo</h2>
          <p className="text-sm text-muted-foreground">Nhận thông báo khi VPS sẵn sàng, sắp hết hạn hoặc gặp lỗi</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm kênh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : channels.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Chưa có kênh thông báo nào. Thêm Telegram, Discord, Webhook hoặc Email để nhận cảnh báo.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {channels.map(c => {
            const meta = TYPE_META[c.type];
            const Icon = meta.icon;
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${meta.color}`}><Icon className="h-5 w-5" /></div>
                    <div>
                      <h4 className="font-semibold">{c.name}</h4>
                      <p className="text-xs text-muted-foreground">{meta.label}</p>
                    </div>
                  </div>
                  <Switch checked={c.enabled} onCheckedChange={() => toggle(c)} />
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.events.map(e => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => test(c)} disabled={testing === c.id}>
                    {testing === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Test
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <NotificationChannelForm open={showForm} onClose={() => setShowForm(false)} onSaved={load} />
      )}
    </div>
  );
}
