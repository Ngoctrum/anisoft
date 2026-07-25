import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useNexusMode } from '@/contexts/NexusModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2, ExternalLink, Loader2, AlertCircle, Eye, ShieldCheck } from 'lucide-react';

type RouteCheck = {
  path: string;
  label: string;
  whenOff: string;
  whenOn: string;
};

const routes: RouteCheck[] = [
  {
    path: '/',
    label: 'Trang chủ',
    whenOff: 'Site Ani Studio (Home cũ)',
    whenOn: 'Nexus Override Landing (shop premium)',
  },
  {
    path: '/tools',
    label: 'Danh sách Tools (site cũ)',
    whenOff: 'Trang Tools của Ani Studio',
    whenOn: 'Redirect về Nexus Landing (route không tồn tại trong Nexus)',
  },
  {
    path: '/nexus',
    label: 'Preview Nexus',
    whenOff: 'Xem trước site Nexus (cho admin duyệt)',
    whenOn: 'Vẫn hiển thị Nexus Landing',
  },
  {
    path: '/nexus/products',
    label: 'Sản phẩm Nexus',
    whenOff: 'Danh sách sản phẩm shop',
    whenOn: 'Danh sách sản phẩm shop',
  },
  {
    path: '/admin',
    label: 'Admin Dashboard',
    whenOff: 'Admin panel (Ani Studio)',
    whenOn: 'Admin panel vẫn truy cập được bình thường',
  },
  {
    path: '/admin/settings',
    label: 'Admin Settings',
    whenOff: 'Cài đặt + toggle Nexus Mode',
    whenOn: 'Cài đặt + toggle Nexus Mode',
  },
];

export default function AdminNexusVerify() {
  const { nexusEnabled, refresh } = useNexusMode();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const toggleFlag = async (val: boolean) => {
    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'nexus_mode_enabled', value: val as any }, { onConflict: 'key' });
    if (error) {
      toast.error('Không lưu được: ' + error.message);
    } else {
      toast.success(val ? 'Đã bật Nexus Mode' : 'Đã tắt Nexus Mode');
      await refresh();
    }
    setSaving(false);
  };

  const open = (path: string) => window.open(path, '_blank', 'noopener,noreferrer');

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Kiểm tra Nexus Mode
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Hướng dẫn xác minh site hiển thị đúng khi bật/tắt Nexus Override cho cả admin và khách.
          </p>
        </div>

        {/* Trạng thái hiện tại */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Trạng thái hiện tại</span>
              <Badge variant={nexusEnabled ? 'default' : 'secondary'}>
                {nexusEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium text-sm">Nexus Mode</div>
                <div className="text-xs text-muted-foreground">
                  Bật để chuyển toàn site sang Nexus Override (admin cũng bị chuyển, riêng <code>/admin/*</code> vẫn vào được).
                </div>
              </div>
              <div className="flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Switch checked={nexusEnabled} disabled={saving} onCheckedChange={toggleFlag} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Đăng nhập: {user ? <span className="text-foreground">{user.email || user.id}</span> : 'chưa đăng nhập'}
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Checklist các route chính</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {routes.map((r) => (
              <div key={r.path} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{r.path}</code>
                    <span className="text-sm text-muted-foreground">— {r.label}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => open(r.path)}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Mở tab mới
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-dashed p-2">
                    <div className="font-semibold mb-0.5">Khi TẮT</div>
                    <div className="text-muted-foreground">{r.whenOff}</div>
                  </div>
                  <div className="rounded border border-primary/40 bg-primary/5 p-2">
                    <div className="font-semibold mb-0.5 text-primary">Khi BẬT</div>
                    <div className="text-muted-foreground">{r.whenOn}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Hướng dẫn xác minh */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Cách xác minh public (khách chưa đăng nhập)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">1</div>
              <p>Mở <b>cửa sổ ẩn danh</b> (Ctrl/Cmd + Shift + N) — đảm bảo không dính session admin.</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">2</div>
              <p>Truy cập domain chính (<code>/</code>). Khi flag BẬT → phải thấy Nexus Landing. Khi TẮT → phải thấy Ani Studio.</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">3</div>
              <p>Thử các đường dẫn cũ như <code>/tools</code>, <code>/apps</code> khi BẬT → được redirect về Nexus Landing (do route không khớp trong <code>NexusRoutes</code>).</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">4</div>
              <p>Truy cập <code>/admin</code> ở cửa sổ ẩn danh → bị đưa về <code>/login</code> vì chưa có quyền admin. OK.</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">5</div>
              <p>Ở cửa sổ chính (đã login admin) → toggle bật/tắt ở trên và F5 các tab public để đối chiếu.</p>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                Nếu vừa toggle mà tab khác chưa đổi → F5 tab đó. Context có realtime subscription nên trong <b>1-2 giây</b> sẽ tự nhận flag mới.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Quick links
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => open('/')}>Mở /</Button>
            <Button variant="outline" size="sm" onClick={() => open('/nexus')}>Mở /nexus</Button>
            <Button variant="outline" size="sm" onClick={() => open('/nexus/products')}>Mở /nexus/products</Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/settings">Đến /admin/settings</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin">Đến /admin</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
