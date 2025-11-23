import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, Users, Download, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTools: 0,
    totalUsers: 0,
    totalDownloads: 0,
    pendingReports: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Count tools
    const { count: toolsCount } = await supabase
      .from('tools')
      .select('*', { count: 'exact', head: true });

    // Count users
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Sum downloads
    const { data: tools } = await supabase
      .from('tools')
      .select('total_downloads');
    
    const totalDownloads = tools?.reduce((sum, tool) => sum + (tool.total_downloads || 0), 0) || 0;

    // Count pending reports
    const { count: reportsCount } = await supabase
      .from('error_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    setStats({
      totalTools: toolsCount || 0,
      totalUsers: usersCount || 0,
      totalDownloads,
      pendingReports: reportsCount || 0,
    });
  };

  const statCards = [
    {
      title: 'Tổng Tools',
      value: stats.totalTools,
      icon: Package,
      description: 'Tools đang hoạt động',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Người dùng',
      value: stats.totalUsers,
      icon: Users,
      description: 'Tài khoản đã đăng ký',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Lượt tải',
      value: stats.totalDownloads.toLocaleString(),
      icon: Download,
      description: 'Tổng lượt tải xuống',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Báo lỗi',
      value: stats.pendingReports,
      icon: AlertCircle,
      description: 'Đang chờ xử lý',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Tổng quan hệ thống Ani Studio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="bg-gradient-card border-border hover:border-primary/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
              <CardDescription>
                Các hoạt động mới nhất trên hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Tính năng đang phát triển
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Tools phổ biến</CardTitle>
              <CardDescription>
                Top tools được tải nhiều nhất
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Tính năng đang phát triển
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}