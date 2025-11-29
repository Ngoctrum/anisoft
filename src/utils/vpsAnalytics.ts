import { supabase } from '@/integrations/supabase/client';

export interface SessionAnalytics {
  totalSessions: number;
  activeSessions: number;
  failedSessions: number;
  totalUptime: number;
  avgSessionDuration: number;
  sessionsByOS: Record<string, number>;
  sessionsByNetworking: Record<string, number>;
  sessionsByConfig: Record<string, number>;
  dailyUsage: Array<{ date: string; count: number }>;
  successRate: number;
}

export async function calculateSessionAnalytics(userId: string): Promise<SessionAnalytics> {
  const { data: sessions, error } = await supabase
    .from('rdp_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !sessions) {
    throw error;
  }

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.is_active && s.status === 'connected').length;
  const failedSessions = sessions.filter(s => s.status === 'failed').length;
  const successfulSessions = sessions.filter(s => s.status === 'connected' || s.status === 'killed').length;
  
  const totalUptime = sessions.reduce((sum, s) => sum + (s.total_uptime_minutes || 0), 0);
  const avgSessionDuration = totalSessions > 0 ? totalUptime / totalSessions : 0;
  
  // Group by OS
  const sessionsByOS: Record<string, number> = {};
  sessions.forEach(s => {
    const os = s.os_type || 'unknown';
    sessionsByOS[os] = (sessionsByOS[os] || 0) + 1;
  });

  // Group by networking
  const sessionsByNetworking: Record<string, number> = {};
  sessions.forEach(s => {
    const networking = s.networking_type || 'unknown';
    sessionsByNetworking[networking] = (sessionsByNetworking[networking] || 0) + 1;
  });

  // Group by config
  const sessionsByConfig: Record<string, number> = {};
  sessions.forEach(s => {
    const config = s.vps_config || 'basic';
    sessionsByConfig[config] = (sessionsByConfig[config] || 0) + 1;
  });

  // Daily usage for last 7 days
  const dailyUsage: Array<{ date: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const count = sessions.filter(s => {
      const sessionDate = new Date(s.created_at).toISOString().split('T')[0];
      return sessionDate === dateStr;
    }).length;
    
    dailyUsage.push({ date: dateStr, count });
  }

  const successRate = totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 0;

  return {
    totalSessions,
    activeSessions,
    failedSessions,
    totalUptime,
    avgSessionDuration,
    sessionsByOS,
    sessionsByNetworking,
    sessionsByConfig,
    dailyUsage,
    successRate,
  };
}

export async function logSessionEvent(
  sessionId: string,
  logType: 'info' | 'warning' | 'error' | 'success',
  message: string,
  metadata: Record<string, any> = {}
) {
  const { error } = await supabase
    .from('session_logs')
    .insert({
      session_id: sessionId,
      log_type: logType,
      message,
      metadata,
    });

  if (error) {
    console.error('Failed to log session event:', error);
  }
}

export async function getSessionLogs(sessionId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('session_logs')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch session logs:', error);
    return [];
  }

  return data || [];
}
