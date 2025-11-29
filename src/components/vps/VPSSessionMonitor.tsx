import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { getSessionLogs } from '@/utils/vpsAnalytics';
import { supabase } from '@/integrations/supabase/client';

interface SessionLog {
  id: string;
  session_id: string;
  log_type: string;
  message: string;
  metadata: any;
  created_at: string;
}

interface VPSSessionMonitorProps {
  sessionId: string;
  sessionName: string;
}

export function VPSSessionMonitor({ sessionId, sessionName }: VPSSessionMonitorProps) {
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();

    // Subscribe to realtime log updates
    const channel = supabase
      .channel(`session-logs-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_logs',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('New log received:', payload);
          setLogs((prev) => [payload.new as SessionLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const loadLogs = async () => {
    try {
      const data = await getSessionLogs(sessionId, 100);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (logType: string) => {
    switch (logType) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogBadgeVariant = (logType: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (logType) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-spin" />
            Đang tải logs...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Real-time Monitoring: {sessionName}
        </CardTitle>
        <CardDescription>
          {logs.length} logs • Cập nhật tự động
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Chưa có log nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
                >
                  <div className="mt-0.5">{getLogIcon(log.log_type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant={getLogBadgeVariant(log.log_type)} className="text-xs">
                        {log.log_type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm">{log.message}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer hover:text-foreground">
                          Chi tiết
                        </summary>
                        <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
