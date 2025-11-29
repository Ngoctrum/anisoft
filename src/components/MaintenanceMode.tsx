import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const MaintenanceMode = ({ children }: { children: React.ReactNode }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkMaintenanceMode();
    checkAdminStatus();
  }, [user]);

  const checkMaintenanceMode = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'general')
      .single();

    if (data?.value) {
      const settings = data.value as any;
      setIsMaintenanceMode(settings.is_site_maintenance || false);
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

  const isAdminRoute = location.pathname.startsWith('/admin');
  const shouldShowMaintenance = isMaintenanceMode && !(isAdmin && isAdminRoute);

  // Hiển thị trang bảo trì cho tất cả mọi người, trừ admin khi đang ở trong khu vực /admin
  if (shouldShowMaintenance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-md w-full text-center space-y-8 relative z-10">
          {/* Icon with enhanced animation */}
          <div className="flex justify-center animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-primary blur-xl opacity-50 animate-pulse" />
              <div className="relative rounded-full bg-gradient-primary p-8 shadow-elevated">
                <AlertTriangle className="h-20 w-20 text-primary-foreground animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
            </div>
          </div>

          {/* Title with gradient */}
          <div className="space-y-3 animate-slide-up">
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              🚧 Đang bảo trì
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-primary rounded-full" />
          </div>

          {/* Description */}
          <div className="space-y-4 animate-slide-up delay-100">
            <p className="text-foreground text-xl font-semibold leading-relaxed">
              Website đang được nâng cấp bởi đội ngũ Team Ani Studio
            </p>
            <p className="text-muted-foreground text-base">
              Chúng tôi đang cải thiện và tối ưu hóa trải nghiệm của bạn với các tính năng mới và hiệu suất tốt hơn.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              <span>Hệ thống sẽ sớm hoạt động trở lại</span>
            </div>
          </div>

          {/* Progress bar with glow effect */}
          <div className="pt-6 animate-slide-up delay-200">
            <div className="relative h-2 w-full bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-primary animate-pulse shadow-glow" style={{ width: '70%' }} />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Đang xử lý...
            </p>
          </div>

          {/* Contact info */}
          <div className="pt-6 space-y-3 text-sm animate-fade-in delay-300">
            <p className="text-muted-foreground">Cần hỗ trợ khẩn cấp?</p>
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-foreground">📧 Email: support@anistudio.com</p>
              <p className="text-muted-foreground text-xs">Đội ngũ Team Ani Studio luôn sẵn sàng hỗ trợ bạn</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
