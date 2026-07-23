import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NexusLayout } from '@/components/nexus/NexusLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  confirmed: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-500 border-red-500/30',
};

const statusLabel: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

export default function NexusOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('nexus_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setOrders(data || []);
    })();
  }, [user]);

  if (!user) {
    return (
      <NexusLayout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold font-heading">Đăng nhập để xem đơn</h1>
          <Button asChild className="mt-4 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white rounded-full">
            <Link to="/login">Đăng nhập</Link>
          </Button>
        </div>
      </NexusLayout>
    );
  }

  return (
    <NexusLayout>
      <section className="container py-10 max-w-4xl">
        <h1 className="font-heading text-3xl font-bold">Đơn của tôi</h1>
        <div className="mt-6 space-y-3">
          {orders.length === 0 && <div className="text-center py-16 text-muted-foreground">Chưa có đơn nào.</div>}
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border bg-card/60 p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <div className="font-medium">{o.product_name}</div>
                <div className="text-xs text-muted-foreground">{o.plan_name} × {o.quantity} · {new Date(o.created_at).toLocaleString('vi-VN')}</div>
              </div>
              <Badge variant="outline" className={statusColor[o.status] || ''}>{statusLabel[o.status] || o.status}</Badge>
              <div className="font-bold text-lg bg-gradient-to-r from-fuchsia-500 to-violet-600 bg-clip-text text-transparent">
                {fmt(o.price * o.quantity)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </NexusLayout>
  );
}
