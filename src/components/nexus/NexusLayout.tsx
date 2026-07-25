import { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Sun, Moon, User, Menu, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNexusMode } from '@/contexts/NexusModeContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const nav = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/products', label: 'Dịch vụ miễn phí' },
  { to: '/products?tier=vip', label: 'Dịch vụ VIP' },
  { to: '/orders', label: 'Liên hệ' },
];

export const NexusLayout = ({ children }: { children: ReactNode }) => {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const { isAdmin } = useNexusMode();

  return (
    <div className="min-h-screen bg-[#f5f2ea] dark:bg-[#0b1210] text-foreground font-body">
      {isAdmin && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-center py-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
          👑 Chế độ Admin — Bạn đang xem site Nexus Override
        </div>
      )}

      <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-6">
        <div className="rounded-[28px] bg-white dark:bg-[#0f1a17] border border-black/5 dark:border-white/5 shadow-[0_20px_60px_-30px_rgba(16,120,90,0.25)] overflow-hidden">
          {/* HEADER */}
          <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-black/5 dark:border-white/5">
            <Link to="/" className="flex items-center gap-2 font-heading font-extrabold tracking-tight text-lg md:text-xl">
              <span className="text-foreground">NEXUS</span>
              <span className="text-emerald-500">OVERRIDE</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 bg-black/[0.03] dark:bg-white/5 rounded-full p-1">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `relative px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-emerald-600 dark:text-emerald-400 after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-0.5 after:bg-emerald-500 after:rounded-full'
                        : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
                >
                  {n.label.toUpperCase()}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Đổi theme" className="rounded-full">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              {user ? (
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <Link to="/account" className="gap-1.5">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Tài khoản</span>
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm" className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Link to="/login">Đăng nhập</Link>
                </Button>
              )}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden rounded-full">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-2 mt-8">
                    {nav.map((n) => (
                      <NavLink
                        key={n.to}
                        to={n.to}
                        end={n.end}
                        className={({ isActive }) =>
                          `px-4 py-3 rounded-xl text-sm font-semibold ${
                            isActive ? 'bg-emerald-500/15 text-emerald-600' : 'hover:bg-muted'
                          }`
                        }
                      >
                        {n.label}
                      </NavLink>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </header>

          {/* PAGE BODY */}
          <div className="px-3 md:px-8 py-6 md:py-10">{children}</div>

          {/* FOOTER */}
          <footer className="border-t border-black/5 dark:border-white/5 px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-foreground">NEXUS<span className="text-emerald-500">OVERRIDE</span></span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/products" className="hover:text-emerald-500">Dịch vụ</Link>
              <Link to="/orders" className="hover:text-emerald-500">Đơn hàng</Link>
              <a href="#" className="hover:text-emerald-500 inline-flex items-center gap-1"><Facebook className="h-3.5 w-3.5" />Fanpage</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
