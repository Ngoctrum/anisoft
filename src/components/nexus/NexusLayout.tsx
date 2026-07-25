import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Sun, Moon, User, Menu, Facebook, Sparkles, ShoppingBag, Home, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNexusMode } from '@/contexts/NexusModeContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const nav = [
  { to: '/', label: 'Trang chủ', icon: Home, end: true },
  { to: '/products', label: 'Miễn phí', icon: Sparkles },
  { to: '/products?tier=vip', label: 'Dịch vụ VIP', icon: ShoppingBag },
  { to: '/orders', label: 'Liên hệ', icon: Phone },
];

export const NexusLayout = ({ children }: { children: ReactNode }) => {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const { isAdmin } = useNexusMode();
  const { pathname, search } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const currentKey = pathname + search;
  const isActive = (n: typeof nav[number]) => {
    if (n.end) return pathname === '/';
    if (n.to.includes('?')) return currentKey === n.to;
    return pathname.startsWith(n.to) && !n.to.includes('?');
  };

  return (
    <div className="min-h-screen bg-[#f5f2ea] dark:bg-[#0b1210] text-foreground font-body">
      {isAdmin && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-center py-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
          👑 Chế độ Admin — Bạn đang xem site Nexus Override
        </div>
      )}

      {/* Floating sticky header */}
      <div className="sticky top-0 z-50 px-3 md:px-6 pt-3 md:pt-4">
        <header
          className={`mx-auto max-w-6xl transition-all duration-300 ${
            scrolled
              ? 'bg-white/80 dark:bg-[#0f1a17]/80 backdrop-blur-xl shadow-[0_10px_40px_-15px_rgba(16,120,90,0.35)] border-black/10 dark:border-white/10'
              : 'bg-white dark:bg-[#0f1a17] shadow-[0_20px_60px_-30px_rgba(16,120,90,0.25)] border-black/5 dark:border-white/5'
          } border rounded-full px-3 md:px-5 py-2 flex items-center justify-between`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 pl-1 md:pl-2 group">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.6)] group-hover:scale-110 transition-transform">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="absolute inset-0 rounded-full bg-emerald-400/40 blur-md -z-10" />
            </span>
            <span className="font-heading font-extrabold tracking-tight text-base md:text-lg leading-none">
              <span className="text-foreground">NEXUS</span>
              <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">OVERRIDE</span>
            </span>
          </Link>

          {/* Desktop pill nav with animated indicator */}
          <nav className="hidden lg:flex items-center gap-1 relative">
            {nav.map((n) => {
              const active = isActive(n);
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={`relative px-4 py-2 rounded-full text-[13px] font-bold tracking-wide uppercase transition-colors duration-200 ${
                    active
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_6px_20px_-6px_rgba(16,185,129,0.7)] -z-10" />
                  )}
                  {n.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Đổi theme"
              className="rounded-full h-9 w-9 hover:bg-emerald-500/10 hover:text-emerald-500"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <Button asChild variant="ghost" size="sm" className="rounded-full h-9 hover:bg-emerald-500/10 hover:text-emerald-600">
                <Link to="/account" className="gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs font-semibold">Tài khoản</span>
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className="rounded-full h-9 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.6)] border-0"
              >
                <Link to="/login" className="text-xs font-bold">Đăng nhập</Link>
              </Button>
            )}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden rounded-full h-9 w-9 hover:bg-emerald-500/10 hover:text-emerald-600">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-white dark:bg-[#0f1a17] border-l border-black/5 dark:border-white/5 p-0">
                <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600">
                      <Sparkles className="h-4 w-4 text-white" />
                    </span>
                    <span className="font-heading font-extrabold text-sm">
                      NEXUS<span className="text-emerald-500">OVERRIDE</span>
                    </span>
                  </div>
                  <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-1 p-3">
                  {nav.map((n) => {
                    const active = isActive(n);
                    const Icon = n.icon;
                    return (
                      <NavLink
                        key={n.to}
                        to={n.to}
                        end={n.end}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                          active
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.6)]'
                            : 'hover:bg-emerald-500/10 hover:text-emerald-600 text-foreground/80'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {n.label}
                      </NavLink>
                    );
                  })}
                </div>
                <div className="px-5 pt-3 pb-5 border-t border-black/5 dark:border-white/5 mt-2">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">Kết nối</p>
                  <a href="#" className="flex items-center gap-2 text-sm text-foreground/70 hover:text-emerald-500">
                    <Facebook className="h-4 w-4" /> Fanpage chính thức
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
      </div>

      {/* PAGE BODY */}
      <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-6">
        <div className="rounded-[28px] bg-white dark:bg-[#0f1a17] border border-black/5 dark:border-white/5 shadow-[0_20px_60px_-30px_rgba(16,120,90,0.25)] overflow-hidden">
          <div className="px-3 md:px-8 py-6 md:py-10">{children}</div>

          <footer className="border-t border-black/5 dark:border-white/5 px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-foreground">
                NEXUS<span className="text-emerald-500">OVERRIDE</span>
              </span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/products" className="hover:text-emerald-500">Dịch vụ</Link>
              <Link to="/orders" className="hover:text-emerald-500">Đơn hàng</Link>
              <a href="#" className="hover:text-emerald-500 inline-flex items-center gap-1">
                <Facebook className="h-3.5 w-3.5" />Fanpage
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
