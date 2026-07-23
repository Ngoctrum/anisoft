import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface NexusModeCtx {
  nexusEnabled: boolean;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const NexusModeContext = createContext<NexusModeCtx>({
  nexusEnabled: false,
  isAdmin: false,
  loading: true,
  refresh: async () => {},
});

export const NexusModeProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [nexusEnabled, setNexusEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFlag = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'nexus_mode_enabled')
      .maybeSingle();
    // value is jsonb boolean or {enabled:true}
    const v = data?.value as any;
    setNexusEnabled(v === true || v?.enabled === true);
  };

  const loadRole = async () => {
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

  const refresh = async () => {
    await Promise.all([loadFlag(), loadRole()]);
  };

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();

    const channel = supabase
      .channel('site_settings_nexus')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: 'key=eq.nexus_mode_enabled' },
        () => {
          loadFlag();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  return (
    <NexusModeContext.Provider value={{ nexusEnabled, isAdmin, loading, refresh }}>
      {children}
    </NexusModeContext.Provider>
  );
};

export const useNexusMode = () => useContext(NexusModeContext);
