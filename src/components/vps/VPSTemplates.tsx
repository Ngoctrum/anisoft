import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Rocket, Star, Trash2, Plus, Loader2 } from 'lucide-react';
import { SaveTemplateDialog } from './SaveTemplateDialog';

export interface VPSTemplate {
  id: string;
  name: string;
  description: string | null;
  os_type: string;
  networking_type: string;
  vps_config: string;
  duration_hours: number;
  icon: string | null;
  is_favorite: boolean;
}

interface Props {
  onDeploy: (t: VPSTemplate) => void;
  currentConfig?: {
    os_type: string;
    networking_type: string;
    vps_config: string;
    duration_hours: number;
  };
}

const PRESETS: Omit<VPSTemplate, 'id'>[] = [
  { name: 'Ubuntu Dev', description: 'Ubuntu 24.04 + Tailscale, 6h', os_type: 'ubuntu', networking_type: 'tailscale', vps_config: 'standard', duration_hours: 6, icon: '🐧', is_favorite: false },
  { name: 'Windows Gaming', description: 'Windows RDP + Cloudflare Tunnel', os_type: 'windows', networking_type: 'cloudflare', vps_config: 'premium', duration_hours: 5, icon: '🎮', is_favorite: false },
  { name: 'Linux noVNC', description: 'Debian + noVNC (không cần cài app)', os_type: 'debian', networking_type: 'novnc', vps_config: 'standard', duration_hours: 6, icon: '🖥️', is_favorite: false },
];

export function VPSTemplates({ onDeploy, currentConfig }: Props) {
  const [templates, setTemplates] = useState<VPSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSave, setShowSave] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vps_templates')
      .select('*')
      .order('is_favorite', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) toast.error('Lỗi tải templates: ' + error.message);
    else setTemplates((data || []) as VPSTemplate[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleFav = async (t: VPSTemplate) => {
    const { error } = await supabase.from('vps_templates').update({ is_favorite: !t.is_favorite }).eq('id', t.id);
    if (error) toast.error(error.message); else load();
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa template này?')) return;
    const { error } = await supabase.from('vps_templates').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Đã xóa'); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Templates VPS</h2>
          <p className="text-sm text-muted-foreground">Lưu cấu hình yêu thích và deploy chỉ với 1 click</p>
        </div>
        {currentConfig && (
          <Button onClick={() => setShowSave(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Lưu cấu hình hiện tại
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <>
          {templates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Của bạn</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map(t => (
                  <TemplateCard key={t.id} t={t} onDeploy={onDeploy} onFav={toggleFav} onDelete={remove} />
                ))}
              </div>
            </div>
          )}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Preset đề xuất</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {PRESETS.map((p, i) => (
                <TemplateCard key={i} t={{ ...p, id: `preset-${i}` }} onDeploy={onDeploy} isPreset />
              ))}
            </div>
          </div>
        </>
      )}

      {showSave && currentConfig && (
        <SaveTemplateDialog
          open={showSave}
          onClose={() => setShowSave(false)}
          config={currentConfig}
          onSaved={load}
        />
      )}
    </div>
  );
}

function TemplateCard({
  t, onDeploy, onFav, onDelete, isPreset,
}: {
  t: VPSTemplate;
  onDeploy: (t: VPSTemplate) => void;
  onFav?: (t: VPSTemplate) => void;
  onDelete?: (id: string) => void;
  isPreset?: boolean;
}) {
  return (
    <Card className="p-5 hover:border-primary/50 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="text-4xl">{t.icon || '🖥️'}</div>
        {!isPreset && onFav && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onFav(t)}>
            <Star className={`h-4 w-4 ${t.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
        )}
      </div>
      <h3 className="font-semibold text-base mb-1">{t.name}</h3>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[2rem]">{t.description || '—'}</p>
      <div className="flex flex-wrap gap-1 mb-4">
        <Badge variant="secondary" className="text-xs">{t.os_type}</Badge>
        <Badge variant="outline" className="text-xs">{t.networking_type}</Badge>
        <Badge variant="outline" className="text-xs">{t.vps_config}</Badge>
        <Badge variant="outline" className="text-xs">{t.duration_hours}h</Badge>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 gap-1" onClick={() => onDeploy(t)}>
          <Rocket className="h-3.5 w-3.5" /> Deploy
        </Button>
        {!isPreset && onDelete && (
          <Button size="sm" variant="ghost" onClick={() => onDelete(t.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </Card>
  );
}
