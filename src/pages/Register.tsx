import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Sparkles, ArrowLeft, User as UserIcon, Lock, ShieldCheck } from 'lucide-react';
import { z } from 'zod';

const registerSchema = z
  .object({
    username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự').max(20, 'Tên đăng nhập không được quá 20 ký tự'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      registerSchema.parse({ username, password, confirmPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    setLoading(true);
    const { error } = await signUp(username, password);
    if (error) {
      if (error.message.includes('already registered')) toast.error('Tên đăng nhập đã tồn tại');
      else toast.error('Đăng ký thất bại. Vui lòng thử lại.');
    } else {
      toast.success('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/'), 1000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh bg-[#f5f2ea] dark:bg-[#0b1210] text-foreground font-body flex items-center justify-center p-4 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />

      <div className="w-full max-w-md relative">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-600 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 rounded-md px-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Về trang chủ
        </Link>

        <div className="rounded-[28px] bg-white dark:bg-[#0f1a17] border border-black/5 dark:border-white/5 shadow-[0_30px_80px_-30px_rgba(16,120,90,0.4)] p-6 md:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_10px_30px_-8px_rgba(16,185,129,0.7)]">
              <Sparkles className="h-5 w-5 text-white" />
              <span className="absolute inset-0 rounded-2xl bg-emerald-400/40 blur-lg -z-10 animate-pulse" />
            </span>
            <h1 className="font-heading font-extrabold text-2xl mt-3 tracking-tight">
              NEXUS<span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">OVERRIDE</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Tạo tài khoản mới miễn phí</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tên đăng nhập
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  className="pl-9 h-11 rounded-xl bg-black/[0.02] dark:bg-white/5 border-black/10 dark:border-white/10 focus-visible:ring-emerald-500/70"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">3-20 ký tự, không dấu</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pl-9 h-11 rounded-xl bg-black/[0.02] dark:bg-white/5 border-black/10 dark:border-white/10 focus-visible:ring-emerald-500/70"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Tối thiểu 6 ký tự</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Xác nhận mật khẩu
              </Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pl-9 h-11 rounded-xl bg-black/[0.02] dark:bg-white/5 border-black/10 dark:border-white/10 focus-visible:ring-emerald-500/70"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="group relative w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-[0_10px_28px_-8px_rgba(16,185,129,0.7)] hover:shadow-[0_14px_32px_-6px_rgba(16,185,129,0.9)] transition-all overflow-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0f1a17]"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-700" />
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang đăng ký...
                </>
              ) : (
                'Đăng ký'
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground pt-2">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
