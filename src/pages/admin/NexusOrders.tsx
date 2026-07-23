import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

const statuses = [
  { v: 'pending', l: 'Chờ' },
  { v: 'confirmed', l: 'Xác nhận' },
  { v: 'delivered', l: 'Đã giao' },
  { v: 'cancelled', l: 'Hủy' },
];

export default function AdminNexusOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from('nexus_orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('nexus_orders').update({ status }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Đã cập nhật');
    load();
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Nexus - Đơn hàng</h1>
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-muted/50"><tr>
            <th className="p-3 text-left">Thời gian</th>
            <th className="p-3 text-left">Sản phẩm / Gói</th>
            <th className="p-3 text-left">Khách</th>
            <th className="p-3 text-left">Liên hệ</th>
            <th className="p-3 text-right">Tổng</th>
            <th className="p-3">Trạng thái</th>
          </tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-3 text-xs">{new Date(o.created_at).toLocaleString('vi-VN')}</td>
                <td className="p-3">
                  <div className="font-medium">{o.product_name}</div>
                  <div className="text-xs text-muted-foreground">{o.plan_name} × {o.quantity}</div>
                </td>
                <td className="p-3">{o.contact_name}<div className="text-xs text-muted-foreground">{o.contact_phone}</div></td>
                <td className="p-3"><Badge variant="outline">{o.contact_channel}</Badge> <span className="text-xs">{o.contact_value}</span></td>
                <td className="p-3 text-right font-bold">{fmt(o.price * o.quantity)}</td>
                <td className="p-3">
                  <Select value={o.status} onValueChange={(v) => setStatus(o.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{statuses.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Chưa có đơn</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
