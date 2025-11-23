import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Search, User, LogOut, Download, Home, FileText, HelpCircle, Shield, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
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
        className="flex items-center gap-2 text-foreground/80 hover:text-primary hover:bg-primary/10 transition-all font-medium px-3 py-2 rounded-lg"
      >
        <Home className="h-4 w-4" />
        <span>Trang chủ</span>
      </Link>
      <Link 
        to="/tools" 
        className="flex items-center gap-2 text-foreground/80 hover:text-primary hover:bg-primary/10 transition-all font-medium px-3 py-2 rounded-lg"
      >
        <Download className="h-4 w-4" />
        <span>Tools</span>
      </Link>
      <Link 
        to="/docs" 
        className="flex items-center gap-2 text-foreground/80 hover:text-primary hover:bg-primary/10 transition-all font-medium px-3 py-2 rounded-lg"
      >
        <FileText className="h-4 w-4" />
        <span>Hướng dẫn</span>
      </Link>
      <Link 
        to="/support" 
        className="flex items-center gap-2 text-foreground/80 hover:text-primary hover:bg-primary/10 transition-all font-medium px-3 py-2 rounded-lg"
      >
        <HelpCircle className="h-4 w-4" />
        <span>Hỗ trợ</span>
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 pointer-events-none" />
      <div className="container relative flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-3 group relative">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-primary blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-9 w-9 rounded-xl bg-gradient-primary shadow-glow group-hover:scale-110 transition-transform flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Ani Studio
              </span>
              <p className="text-xs text-muted-foreground -mt-1">Tools & Code Hub</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-2">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex rounded-full hover:bg-primary/10 hover:text-primary transition-all" 
            onClick={() => navigate('/tools')}
          >
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <>
              {isAdmin && (
                <Button
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  className="hidden md:flex items-center gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 text-primary relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  <Shield className="h-4 w-4 relative z-10" />
                  <span className="relative z-10 font-medium">Admin Panel</span>
                  <Badge variant="secondary" className="relative z-10 ml-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                    PRO
                  </Badge>
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/30 transition-all">
                    <Avatar className="h-10 w-10 border-2 border-primary/30">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.display_name} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                        {profile?.display_name?.[0] || profile?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {isAdmin && (
                      <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-sm border-border/50">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none flex items-center gap-2">
                        {profile?.display_name || profile?.username}
                        {isAdmin && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary">
                            Admin
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        @{profile?.username}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem onClick={() => navigate('/account')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Tài khoản
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account')} className="cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    Lịch sử tải
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="bg-border/50 md:hidden" />
                      <DropdownMenuItem 
                        onClick={() => navigate('/admin')}
                        className="text-primary cursor-pointer md:hidden"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')} 
                className="hidden md:flex hover:bg-primary/10 hover:text-primary transition-all"
              >
                Đăng nhập
              </Button>
              <Button 
                onClick={() => navigate('/register')} 
                className="hidden md:flex relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-primary" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-accent/50 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                <span className="relative z-10">Đăng ký</span>
              </Button>
            </>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-primary/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-card/95 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-gradient-primary blur-sm opacity-50" />
                  <div className="relative h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">Ani Studio</span>
                  <p className="text-xs text-muted-foreground">Tools & Code Hub</p>
                </div>
              </div>
              <nav className="flex flex-col gap-2">
                <NavLinks />
                {user && isAdmin && (
                  <>
                    <div className="h-px bg-border/50 my-2" />
                    <Button
                      onClick={() => { navigate('/admin'); setMobileOpen(false); }}
                      variant="outline"
                      className="justify-start border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                      <Badge variant="secondary" className="ml-auto bg-primary text-primary-foreground text-[10px]">
                        PRO
                      </Badge>
                    </Button>
                  </>
                )}
                {!user && (
                  <>
                    <div className="h-px bg-border/50 my-2" />
                    <Button 
                      variant="outline" 
                      onClick={() => { navigate('/login'); setMobileOpen(false); }}
                      className="justify-start hover:bg-primary/10"
                    >
                      Đăng nhập
                    </Button>
                    <Button 
                      onClick={() => { navigate('/register'); setMobileOpen(false); }}
                      className="relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-primary" />
                      <span className="relative z-10">Đăng ký</span>
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