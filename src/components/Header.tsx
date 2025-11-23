import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Search, User, LogOut, Settings, Download, Home, FileText, HelpCircle, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();
    
    setProfile(profileData);

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();
    
    setIsAdmin(!!roleData);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const NavLinks = () => (
    <>
      <Link 
        to="/" 
        className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors font-medium"
      >
        <Home className="h-4 w-4" />
        <span>Trang chủ</span>
      </Link>
      <Link 
        to="/tools" 
        className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors font-medium"
      >
        <Download className="h-4 w-4" />
        <span>Tools</span>
      </Link>
      <Link 
        to="/docs" 
        className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors font-medium"
      >
        <FileText className="h-4 w-4" />
        <span>Hướng dẫn</span>
      </Link>
      <Link 
        to="/support" 
        className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors font-medium"
      >
        <HelpCircle className="h-4 w-4" />
        <span>Hỗ trợ</span>
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary shadow-glow group-hover:scale-110 transition-transform" />
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Ani Studio
              </span>
              <p className="text-xs text-muted-foreground -mt-1">Tools & Code Hub</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex rounded-full hover:bg-primary/10" 
            onClick={() => navigate('/tools')}
          >
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.display_name} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {profile?.display_name?.[0] || profile?.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.display_name || profile?.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      @{profile?.username}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/account')}>
                  <User className="mr-2 h-4 w-4" />
                  Tài khoản
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/account')}>
                  <Download className="mr-2 h-4 w-4" />
                  Lịch sử tải
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => navigate('/admin')}
                      className="text-primary"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')} 
                className="hidden md:flex hover:bg-primary/10"
              >
                Đăng nhập
              </Button>
              <Button 
                onClick={() => navigate('/register')} 
                className="hidden md:flex bg-gradient-primary hover:opacity-90 shadow-glow"
              >
                Đăng ký
              </Button>
            </>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex items-center space-x-2 mb-8">
                <div className="h-8 w-8 rounded-lg bg-gradient-primary" />
                <span className="text-lg font-bold">Ani Studio</span>
              </div>
              <nav className="flex flex-col gap-4">
                <NavLinks />
                {!user && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => { navigate('/login'); setMobileOpen(false); }}
                      className="justify-start"
                    >
                      Đăng nhập
                    </Button>
                    <Button 
                      onClick={() => { navigate('/register'); setMobileOpen(false); }}
                      className="bg-gradient-primary"
                    >
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