import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Search, User, LogOut, Settings, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const NavLinks = () => (
    <>
      <Link to="/tools" className="text-foreground hover:text-primary transition-colors">
        Tools
      </Link>
      <Link to="/docs" className="text-foreground hover:text-primary transition-colors">
        Hướng dẫn
      </Link>
      <Link to="/support" className="text-foreground hover:text-primary transition-colors">
        Hỗ trợ
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Ani Studio
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => navigate('/tools')}>
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/account')}>
                  <User className="mr-2 h-4 w-4" />
                  Tài khoản
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/account')}>
                  <Download className="mr-2 h-4 w-4" />
                  Lịch sử tải
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')} className="hidden md:flex">
                Đăng nhập
              </Button>
              <Button onClick={() => navigate('/register')} className="hidden md:flex">
                Đăng ký
              </Button>
            </>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLinks />
                {!user && (
                  <>
                    <Button variant="outline" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                      Đăng nhập
                    </Button>
                    <Button onClick={() => { navigate('/register'); setMobileOpen(false); }}>
                      Đăng ký
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};