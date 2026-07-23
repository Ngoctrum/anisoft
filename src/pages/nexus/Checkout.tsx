import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NexusLayout } from '@/components/nexus/NexusLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

export default function NexusCheckout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    contact_name: '',
    contact_channel: 'zalo',
    contact_value: '',
    contact_phone: '',
    note: '',
    quantity: 1,
  });

  useEffect(() => {
    const slug = params.get('product');
    const planName = params.get('plan');
    if (!slug || !planName) {
      navigate('/products');
      return;
    }
    (async () => {
      const { data } = await supabase.from('nexus_products').select('*').eq('slug', slug).maybeSingle();
      if (data) {
        setProduct(data);
        const pl = (data.plans as any[]).find((x) => x.name === planName);
        setPlan(pl);
      }
      setLoading(false);
    })();
  }, [params, navigate]);

  const submit = async () => {
    if (!product || !plan) return;
    if (!form.contact_name || !form.contact_value) {
      toast.error('Vui lòng điền tên và thông tin liên hệ');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('nexus_orders').insert({
      user_id: user?.id || null,
      product_id: product.id,
      product_name: product.name,
      plan_name: plan.name,
      price: plan.price,
      quantity: form.quantity,
      contact_name: form.contact_name,
      contact_phone: form.contact_phone,
      contact_channel: form.contact_channel,
      contact_value: form.contact_value,
      note: form.note,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Không tạo được đơn: ' + error.message);
      return;
    }
    toast.success('Đã tạo đơn! Chúng tôi sẽ liên hệ bạn sớm.');
    navigate(user ? '/orders' : '/');
  };

  if (loading) {
    return <NexusLayout><div className="container py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div></NexusLayout>;
  }
  if (!product || !plan) return null;

  const total = plan.price * form.quantity;

  return (
    <NexusLayout>
      <section className="container py-10 max-w-3xl">
        <h1 className="font-heading text-3xl font-bold">Thanh toán</h1>
        <p className="text-muted-foreground mt-1">Điền thông tin để đội ngũ Nexus liên hệ xác nhận đơn.</p>

        <div className="mt-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="grid gap-2">
              <Label>Tên của bạn *</Label>
              <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Nguyễn Văn A" />
            </div>
            <div className="grid gap-2">
              <Label>Số điện thoại</Label>
              <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="0xxxxxxxxx" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Liên hệ qua</Label>
                <Select value={form.contact_channel} onValueChange={(v) => setForm({ ...form, contact_channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zalo">Zalo</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="messenger">Messenger</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 col-span-2">
                <Label>Tài khoản liên hệ *</Label>
                <Input value={form.contact_value} onChange={(e) => setForm({ ...form, contact_value: e.target.value })} placeholder="@username / số điện thoại / email" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Ghi chú</Label>
              <Textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 h-fit">
            <div className="text-sm font-medium mb-3">Đơn hàng</div>
            <div className="flex gap-3 items-center">
              {product.image_url && <img src={product.image_url} className="w-14 h-14 rounded-lg object-cover" alt="" />}
              <div className="flex-1">
                <div className="font-medium text-sm line-clamp-1">{product.name}</div>
                <div className="text-xs text-muted-foreground">{plan.name}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Số lượng</span>
              <Input
                type="number"
                min={1}
                className="w-20 h-8"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
              />
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="font-medium">Tổng cộng</span>
              <span className="font-bold text-lg bg-gradient-to-r from-fuchsia-500 to-violet-600 bg-clip-text text-transparent">
                {fmt(total)}
              </span>
            </div>
            <Button
              onClick={submit}
              disabled={submitting}
              size="lg"
              className="w-full mt-5 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white rounded-full"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận đặt
            </Button>
          </div>
        </div>
      </section>
    </NexusLayout>
  );
}
