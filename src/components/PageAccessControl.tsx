import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PageAccessControlProps {
  children: React.ReactNode;
  pageKey: 'tools_enabled' | 'apps_enabled' | 'vps_console_enabled' | 'docs_enabled' | 'support_enabled';
  pageName: string;
}

export const PageAccessControl = ({ children, pageKey, pageName }: PageAccessControlProps) => {
  const [isPageEnabled, setIsPageEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkPageAccess();
    checkAdminStatus();
  }, [user]);

  const checkPageAccess = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'page_visibility')
      .single();

    if (data?.value) {
      const settings = data.value as any;
      setIsPageEnabled(settings[pageKey] !== false);
    }
    setLoading(false);
  };

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    setIsAdmin(!!data);
  };

  if (loading) {
    return null;
  }

  // Admin có thể vào trang bị tắt
  if (!isPageEnabled && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-destructive/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-destructive/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-lg w-full text-center space-y-8 relative z-10">
          {/* Icon */}
          <div className="flex justify-center animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-destructive to-destructive/50 blur-xl opacity-50 animate-pulse" />
              <div className="relative rounded-full bg-gradient-to-r from-destructive to-destructive/80 p-8 shadow-elevated">
                <Lock className="h-20 w-20 text-destructive-foreground animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3 animate-slide-up">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-destructive to-destructive/80 bg-clip-text text-transparent">
              🔒 Trang tạm khóa
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-destructive to-destructive/50 rounded-full" />
          </div>

          {/* Description */}
          <div className="space-y-4 animate-slide-up delay-100">
            <p className="text-foreground text-xl font-semibold">
              Trang <span className="text-primary">{pageName}</span> hiện đang bị tắt
            </p>
            <p className="text-muted-foreground text-base leading-relaxed">
              Trang này đã bị tắt bởi quản trị viên.
              <br />
              Vui lòng quay lại sau hoặc liên hệ admin để biết thêm chi tiết.
            </p>
          </div>

          {/* Action button */}
          <div className="pt-4 animate-slide-up delay-200">
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-primary hover-scale"
              size="lg"
            >
              🏠 Về trang chủ
            </Button>
          </div>

          {/* Contact info */}
          <div className="pt-6 space-y-2 text-sm text-muted-foreground animate-fade-in delay-300">
            <p>Cần hỗ trợ?</p>
            <p className="font-medium text-foreground">📧 support@anistudio.com</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
