import { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Sun, Moon, ShoppingBag, User, Sparkles, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNexusMode } from '@/contexts/NexusModeContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const nav = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/products', label: 'Sản phẩm' },
  { to: '/orders', label: 'Đơn của tôi' },
];

export const NexusLayout = ({ children }: { children: ReactNode }) => {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const { isAdmin } = useNexusMode();

  return (
    <div className="min-h-screen bg-background text-foreground font-body flex flex-col">
      {isAdmin && (
        <div className="bg-primary/10 border-b border-primary/20 text-center py-1.5 text-xs text-primary font-medium">
          👑 Chế độ Admin — Bạn đang xem site Nexus Override
        </div>
      )}

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30 group-hover:scale-110 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-heading font-bold text-lg tracking-tight">Nexus Override</div>
              <div className="text-[10px] text-muted-foreground -mt-0.5">premium account shop</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Đổi theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Đơn hàng">
              <Link to="/orders">
                <ShoppingBag className="h-4 w-4" />
              </Link>
            </Button>
            {user ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/account" className="gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Tài khoản</span>
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white hover:opacity-90">
                <Link to="/login">Đăng nhập</Link>
              </Button>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
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
                        `px-4 py-3 rounded-xl text-sm font-medium ${
                          isActive
                            ? 'bg-primary/15 text-primary'
                            : 'hover:bg-muted'
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
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-card/40 mt-16">
        <div className="container py-10 grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600" />
              <span className="font-heading font-bold">Nexus Override</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Chuyên cung cấp tài khoản premium chính hãng, giá rẻ, bảo hành trọn gói.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Danh mục</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/products?cat=chatgpt" className="hover:text-primary">ChatGPT & AI</Link></li>
              <li><Link to="/products?cat=streaming" className="hover:text-primary">Xem phim & TV</Link></li>
              <li><Link to="/products?cat=design" className="hover:text-primary">Design & Sáng tạo</Link></li>
              <li><Link to="/products?cat=music" className="hover:text-primary">Âm nhạc</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Hỗ trợ</h4>
            <p className="text-sm text-muted-foreground">
              Liên hệ Zalo / Telegram trong phần thanh toán. Đội ngũ hỗ trợ 24/7.
            </p>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nexus Override. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
