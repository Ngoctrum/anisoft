import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Activity, TrendingUp, Server, Clock, CheckCircle, XCircle, Wifi, Radio } from 'lucide-react';
import { calculateSessionAnalytics, SessionAnalytics } from '@/utils/vpsAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ActiveSession {
  id: string;
  github_repo: string;
  os_type: string;
  vps_config: string;
  started_at?: string;
  created_at: string;
  expires_at?: string;
  total_uptime_minutes: number;
  connection_count: number;
  networking_type?: string;
}

export function VPSAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    loadActiveSessions();

    // Real-time updates
    const channel = supabase
      .channel('analytics-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rdp_sessions',
        },
        () => {
          console.log('📊 Analytics: Detected VPS change, reloading...');
          loadAnalytics();
          loadActiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const data = await calculateSessionAnalytics(userData.user.id);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('rdp_sessions')
        .select('id, github_repo, os_type, vps_config, started_at, created_at, expires_at, total_uptime_minutes, connection_count, networking_type')
        .eq('user_id', userData.user.id)
        .eq('is_active', true)
        .eq('status', 'connected')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveSessions(data || []);
    } catch (error) {
      console.error('Failed to load active sessions:', error);
    }
  };

  const formatUptime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getConfigSpecs = (config: string) => {
    const specs = {
      basic: { cpu: '2 vCPU', ram: '2 GB', disk: '20 GB' },
      standard: { cpu: '4 vCPU', ram: '4 GB', disk: '40 GB' },
      premium: { cpu: '16 vCPU', ram: '16 GB', disk: '160 GB' },
    };
    return specs[config as keyof typeof specs] || specs.basic;
  };

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return 'N/A';
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Hết hạn';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading || !analytics) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Đang tải Analytics...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-scale transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Tổng VPS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{analytics.totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">Tất cả phiên đã tạo</p>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Đang Hoạt Động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{analytics.activeSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">VPS đang chạy</p>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Thời Gian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {Math.round(analytics.avgSessionDuration)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Phút trung bình/session</p>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Tỷ Lệ Thành Công
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {analytics.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.failedSessions} thất bại
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OS Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Phân Bổ Hệ Điều Hành</CardTitle>
            <CardDescription>Số lượng VPS theo OS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(analytics.sessionsByOS).map(([os, count]) => {
              const percentage = (count / analytics.totalSessions) * 100;
              const osIcons: Record<string, string> = {
                windows: '🪟',
                ubuntu: '🐧',
                debian: '🌀',
                archlinux: '⚡',
                centos: '🔷',
              };
              
              return (
                <div key={os} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{osIcons[os] || '💻'}</span>
                      <span className="capitalize">{os}</span>
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Networking Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Phân Bổ Networking</CardTitle>
            <CardDescription>Số lượng VPS theo loại mạng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(analytics.sessionsByNetworking).map(([network, count]) => {
              const percentage = (count / analytics.totalSessions) * 100;
              const networkIcons: Record<string, string> = {
                tailscale: '🔒',
                ngrok: '🌐',
              };
              
              return (
                <div key={network} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{networkIcons[network] || '🔌'}</span>
                      <span className="capitalize">{network}</span>
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Config Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cấu Hình VPS</CardTitle>
            <CardDescription>Phân bổ theo tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(analytics.sessionsByConfig).map(([config, count]) => {
              const percentage = (count / analytics.totalSessions) * 100;
              const configIcons: Record<string, string> = {
                basic: '⚡',
                standard: '💎',
                premium: '👑',
              };
              
              return (
                <div key={config} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{configIcons[config]}</span>
                      <span className="capitalize">{config}</span>
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sử Dụng 7 Ngày Qua</CardTitle>
            <CardDescription>Số VPS tạo mỗi ngày</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-32">
              {analytics.dailyUsage.map((day, index) => {
                const maxCount = Math.max(...analytics.dailyUsage.map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full bg-muted rounded-t-lg overflow-hidden group">
                      <div
                        className="bg-primary transition-all hover:bg-primary/80"
                        style={{ height: `${height}%`, minHeight: day.count > 0 ? '8px' : '0' }}
                      />
                      <div className="absolute inset-x-0 -top-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="secondary" className="text-xs">
                          {day.count}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{dayName}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Uptime */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Tổng Thời Gian Uptime
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {Math.floor(analytics.totalUptime / 60)}h {analytics.totalUptime % 60}m
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Tổng thời gian tất cả VPS đã hoạt động
          </p>
        </CardContent>
      </Card>

      {/* Real-time Active Sessions */}
      {activeSessions.length > 0 && (
        <Card className="border-2 border-green-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Radio className="h-4 w-4 text-green-500 animate-pulse" />
                VPS Đang Chạy (Real-time)
              </CardTitle>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                <Wifi className="h-3 w-3 mr-1 animate-pulse" />
                Live
              </Badge>
            </div>
            <CardDescription>Thông tin thời gian sử dụng chi tiết</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSessions.map((session) => {
                const osIcons: Record<string, string> = {
                  windows: '🪟',
                  ubuntu: '🐧',
                  debian: '🌀',
                  archlinux: '⚡',
                  centos: '🔷',
                };
                const configIcons: Record<string, string> = {
                  basic: '⚡',
                  standard: '💎',
                  premium: '👑',
                };
                const networkIcons: Record<string, string> = {
                  tailscale: '🔒',
                  ngrok: '🌐',
                };

                return (
                  <div 
                    key={session.id} 
                    className="p-4 rounded-xl bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/20 hover:border-green-500/40 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{osIcons[session.os_type] || '💻'}</span>
                        <span className="font-mono font-semibold text-sm">{session.github_repo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10 transition-colors">
                              {configIcons[session.vps_config]} {session.vps_config}
                            </Badge>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4 bg-gradient-to-br from-background to-muted/30 border-2 border-green-500/20 shadow-xl">
                            <div className="space-y-3">
                              <h4 className="font-bold text-sm flex items-center gap-2">
                                <Server className="h-4 w-4 text-green-500" />
                                Chi tiết cấu hình: {session.vps_config.toUpperCase()}
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 bg-background/50 rounded-lg">
                                  <span className="text-muted-foreground">CPU:</span>
                                  <span className="font-semibold">{getConfigSpecs(session.vps_config).cpu}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-background/50 rounded-lg">
                                  <span className="text-muted-foreground">RAM:</span>
                                  <span className="font-semibold">{getConfigSpecs(session.vps_config).ram}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-background/50 rounded-lg">
                                  <span className="text-muted-foreground">Disk:</span>
                                  <span className="font-semibold">{getConfigSpecs(session.vps_config).disk}</span>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Badge variant="outline" className="text-xs">
                          {networkIcons[session.networking_type || 'tailscale']} {session.networking_type}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">⏱️ Uptime</p>
                        <p className="font-mono font-bold text-green-500">
                          {formatUptime(session.total_uptime_minutes)}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">🔌 Kết nối</p>
                        <p className="font-mono font-bold">
                          {session.connection_count || 0} lần
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">⏰ Còn lại</p>
                        <p className="font-mono font-bold text-blue-500">
                          {getTimeRemaining(session.expires_at)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">🕐 Tạo lúc</p>
                        <p className="font-mono text-xs">
                          {new Date(session.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar for time remaining */}
                    {session.expires_at && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Tiến độ thời gian</span>
                          <span>
                            {(() => {
                              const now = new Date().getTime();
                              const created = new Date(session.created_at).getTime();
                              const expires = new Date(session.expires_at).getTime();
                              const progress = ((now - created) / (expires - created)) * 100;
                              return Math.min(100, Math.max(0, progress)).toFixed(0);
                            })()}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-1000"
                            style={{
                              width: `${(() => {
                                const now = new Date().getTime();
                                const created = new Date(session.created_at).getTime();
                                const expires = new Date(session.expires_at).getTime();
                                const progress = ((now - created) / (expires - created)) * 100;
                                return Math.min(100, Math.max(0, progress));
                              })()}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
