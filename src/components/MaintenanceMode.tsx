import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';

export const MaintenanceMode = ({ children }: { children: React.ReactNode }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

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

  // Admin có thể vào khi bảo trì
  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-gradient-primary p-6">
              <AlertTriangle className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Đang bảo trì
          </h1>
          <p className="text-muted-foreground text-lg">
            Website đang trong quá trình bảo trì và nâng cấp.
            <br />
            Vui lòng quay lại sau.
          </p>
          <div className="pt-4">
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary animate-pulse w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
