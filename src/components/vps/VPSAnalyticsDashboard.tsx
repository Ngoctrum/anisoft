import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Activity, TrendingUp, Server, Clock, CheckCircle, XCircle } from 'lucide-react';
import { calculateSessionAnalytics, SessionAnalytics } from '@/utils/vpsAnalytics';
import { supabase } from '@/integrations/supabase/client';

export function VPSAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
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
    </div>
  );
}
