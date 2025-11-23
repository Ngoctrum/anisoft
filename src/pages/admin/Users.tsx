import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, User, Ban } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(role)
      `)
      .order('created_at', { ascending: false });

    setUsers(profiles || []);
    setLoading(false);
  };

  const handleToggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentlyBlocked })
      .eq('id', userId);

    if (error) {
      toast.error('Cập nhật thất bại');
    } else {
      toast.success(currentlyBlocked ? 'Đã mở khóa user' : 'Đã khóa user');
      loadUsers();
    }
  };

  const getUserRole = (userRoles: any[]) => {
    if (!userRoles || userRoles.length === 0) return 'user';
    const roles = userRoles.map((r) => r.role);
    if (roles.includes('super_admin')) return 'super_admin';
    if (roles.includes('admin')) return 'admin';
    return 'user';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-red-500">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-orange-500">Admin</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Users</h1>
          <p className="text-muted-foreground">
            Xem và quản lý người dùng trên hệ thống
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {users.map((user) => {
              const role = getUserRole(user.user_roles);
              return (
                <Card key={user.id} className="bg-gradient-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 border-2 border-primary/20">
                        <AvatarImage src={user.avatar_url} alt={user.display_name} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                          {user.display_name?.[0] || user.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{user.display_name || user.username}</h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRoleBadge(role)}
                            {user.is_blocked && (
                              <Badge variant="destructive">
                                <Ban className="h-3 w-3 mr-1" />
                                Đã khóa
                              </Badge>
                            )}
                          </div>
                        </div>

                        {user.bio && (
                          <p className="text-sm text-muted-foreground">{user.bio}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Tham gia: {new Date(user.created_at).toLocaleDateString('vi-VN')}
                          </span>
                          {user.last_login_at && (
                            <span>
                              Đăng nhập: {new Date(user.last_login_at).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant={user.is_blocked ? "default" : "destructive"}
                            size="sm"
                            onClick={() => handleToggleBlock(user.id, user.is_blocked)}
                          >
                            {user.is_blocked ? 'Mở khóa' : 'Khóa user'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}