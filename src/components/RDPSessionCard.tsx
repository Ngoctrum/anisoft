import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Server, User, Key, Copy, ExternalLink, Download, Power, PowerOff, AlertTriangle, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { VPSQuickActions } from './vps/VPSQuickActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VPSSessionMonitor } from './vps/VPSSessionMonitor';

interface RDPSession {
  id: string;
  github_repo: string;
  repo_url?: string;
  tailscale_ip?: string;
  ngrok_url?: string;
  networking_type?: string;
  rdp_user?: string;
  rdp_password?: string;
  status: string;
  created_at: string;
  expires_at?: string;
  os_type?: string;
  vps_config?: string;
  duration_hours?: number;
  is_active?: boolean;
  ssh_port?: number;
  workflow_run_id?: string;
}

interface RDPSessionCardProps {
  session: RDPSession;
  onDelete: () => void;
  onKill?: () => void;
  onStart?: () => void;
}

export function RDPSessionCard({ session, onDelete, onKill, onStart }: RDPSessionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isKilling, setIsKilling] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);

  useEffect(() => {
    if (!session.expires_at) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(session.expires_at!).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Hết hạn');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session.expires_at]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã copy ${label}`);
  };

  const getServerAddress = () => {
    if (session.networking_type === 'ngrok' && session.ngrok_url) {
      return session.ngrok_url.replace(/^tcp:\/\//, '');
    }
    return session.tailscale_ip?.replace(/^tcp:\/\//, '') || '';
  };

  const copyAllInfo = () => {
    const server = getServerAddress();
    const info = `Server: ${server}\nUsername: ${session.rdp_user || ''}\nPassword: ${session.rdp_password || ''}`;
    navigator.clipboard.writeText(info);
    toast.success('Đã copy toàn bộ thông tin');
  };

  const copySSHCommand = () => {
    const server = getServerAddress();
    
    // Parse Ngrok URL format (host:port) to SSH format (ssh user@host -p port)
    let sshCommand: string;
    if (session.networking_type === 'ngrok' && server.includes(':')) {
      const [host, port] = server.split(':');
      sshCommand = `ssh ${session.rdp_user}@${host} -p ${port}`;
    } else {
      sshCommand = `ssh ${session.rdp_user}@${server}`;
    }
    
    navigator.clipboard.writeText(sshCommand);
    toast.success('✅ Đã copy lệnh SSH!', {
      description: `${sshCommand}\nPaste vào CMD/Terminal để kết nối`
    });
  };

  const downloadRDPFile = () => {
    const server = getServerAddress();
    const username = session.rdp_user || '';
    
    const rdpContent = `screen mode id:i:2
use multimon:i:0
desktopwidth:i:1920
desktopheight:i:1080
session bpp:i:32
winposstr:s:0,3,0,0,800,600
compression:i:1
keyboardhook:i:2
audiocapturemode:i:0
videoplaybackmode:i:1
connection type:i:7
networkautodetect:i:1
bandwidthautodetect:i:1
displayconnectionbar:i:1
enableworkspacereconnect:i:0
disable wallpaper:i:0
allow font smoothing:i:0
allow desktop composition:i:0
disable full window drag:i:1
disable menu anims:i:1
disable themes:i:0
disable cursor setting:i:0
bitmapcachepersistenable:i:1
full address:s:${server}
audiomode:i:0
redirectprinters:i:1
redirectcomports:i:0
redirectsmartcards:i:1
redirectclipboard:i:1
redirectposdevices:i:0
redirectdrives:i:1
drivestoredirect:s:*
autoreconnection enabled:i:1
authentication level:i:0
prompt for credentials:i:0
negotiate security layer:i:1
remoteapplicationmode:i:0
alternate shell:s:
shell working directory:s:
gatewayhostname:s:
gatewayusagemethod:i:4
gatewaycredentialssource:i:4
gatewayprofileusagemethod:i:0
promptcredentialonce:i:0
gatewaybrokeringtype:i:0
use redirection server name:i:0
rdgiskdcproxy:i:0
kdcproxyname:s:
username:s:${username}`;

    const blob = new Blob([rdpContent], { type: 'application/x-rdp' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.github_repo}.rdp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Copy password to clipboard automatically
    if (session.rdp_password) {
      navigator.clipboard.writeText(session.rdp_password);
      toast.success('Đã tải file RDP và copy mật khẩu vào clipboard!', {
        description: `Mật khẩu: ${session.rdp_password} - Paste khi RDP hỏi password`
      });
    } else {
      toast.success('Đã tải file RDP');
    }
  };

  const getStatusColor = () => {
    if (!session.is_active) return 'bg-gray-500';
    switch (session.status) {
      case 'connected':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
      case 'killed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (!session.is_active) return 'Đã tắt';
    switch (session.status) {
      case 'connected':
        return 'Đang chạy';
      case 'pending':
        return 'Đang tạo';
      case 'failed':
        return 'Thất bại';
      case 'killed':
        return 'Đã kill';
      default:
        return session.status;
    }
  };

  const hasFullInfo = (session.tailscale_ip || session.ngrok_url) && session.rdp_user && session.rdp_password;
  const osIcon = session.os_type === 'ubuntu' ? '🐧' : '🪟';
  const osName = session.os_type === 'ubuntu' ? 'Ubuntu SSH' : 'Windows RDP';
  const networkingIcon = session.networking_type === 'ngrok' ? '🌐' : '🔒';
  const networkingName = session.networking_type === 'ngrok' ? 'Ngrok' : 'Tailscale';
  const serverAddress = getServerAddress();
  const connectionCommand = session.os_type === 'ubuntu' 
    ? `ssh ${session.rdp_user}@${serverAddress}` 
    : 'RDP';

  const handleKillVPS = async () => {
    if (!confirm('⚠️ Bạn có chắc muốn TẮT VPS này không?\n\nVPS sẽ dừng hoàn toàn.')) {
      return;
    }

    setIsKilling(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-vps', {
        body: {
          sessionId: session.id,
          action: 'kill',
          githubToken: sessionStorage.getItem('github_token'),
          workflowRunId: session.workflow_run_id,
        },
      });

      if (error) throw error;
      toast.success('✅ Đã tắt VPS thành công!');
    } catch (error: any) {
      console.error('Error killing VPS:', error);
      toast.error('❌ Không thể tắt VPS: ' + error.message);
    } finally {
      setIsKilling(false);
    }
  };

  const handleStartVPS = async () => {
    setIsStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-vps', {
        body: {
          sessionId: session.id,
          action: 'start',
          githubToken: sessionStorage.getItem('github_token'),
        },
      });

      if (error) throw error;
      toast.success('✅ Đang khởi động lại VPS! Vui lòng đợi vài phút...');
    } catch (error: any) {
      console.error('Error starting VPS:', error);
      toast.error('❌ Không thể khởi động VPS: ' + error.message);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <>
      <Card className={`relative transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-2 overflow-hidden group ${
        session.is_active && session.status === 'connected' 
          ? 'border-green-500/50 shadow-green-500/10 bg-gradient-to-br from-green-500/5 to-transparent' 
          : 'border-border/50 bg-card/50 backdrop-blur-sm'
      }`}>
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-700" />
        
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className={`p-3 rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                session.is_active && session.status === 'connected' 
                  ? 'bg-gradient-to-br from-green-500/20 to-green-500/10' 
                  : 'bg-muted/50'
              }`}>
                <Server className={`h-6 w-6 ${
                  session.is_active && session.status === 'connected' 
                    ? 'text-green-500 animate-pulse' 
                    : 'text-primary'
                }`} />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                  <span className="truncate font-bold">{osIcon} {session.github_repo}</span>
                  <Badge 
                    className={`${getStatusColor()} ${
                      session.is_active && session.status === 'connected' 
                        ? 'pulse-glow shadow-lg shadow-green-500/50' 
                        : ''
                    } transition-all duration-300`}
                  >
                    {getStatusText()}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs gap-1">
                    {networkingIcon} {networkingName}
                  </Badge>
                  {session.vps_config && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {session.vps_config === 'premium' ? '👑' : session.vps_config === 'standard' ? '💎' : '⚡'} {session.vps_config}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <VPSQuickActions
              sessionId={session.id}
              sessionName={session.github_repo}
              isActive={session.is_active || false}
              onDelete={() => {/* Handled by parent */}}
              onKill={handleKillVPS}
              onStart={handleStartVPS}
              onViewLogs={() => setShowLogsDialog(true)}
            />
          </div>
        </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Failed Status Alert */}
        {session.status === 'failed' && (
          <Alert className="bg-gradient-to-r from-destructive/10 to-destructive/5 border-2 border-destructive/50 shadow-lg">
            <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
            <AlertDescription className="ml-2">
              <p className="font-bold text-destructive text-base">⚠️ VPS tạo thất bại!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Không thể khởi động VPS. VPS này sẽ tự động bị xóa trong vòng 1 giờ tới.
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Repo Link */}
        {session.repo_url && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 hover-scale transition-all duration-300">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ExternalLink className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Repository</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(session.repo_url, '_blank')}
              className="gap-2 hover:bg-primary/10"
            >
              <span className="font-semibold">GitHub</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Connection Info */}
        {(session.tailscale_ip || session.ngrok_url) && (
          <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
            <h4 className="font-semibold flex items-center gap-2 text-foreground">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Server className="h-4 w-4 text-primary" />
              </div>
              Thông tin kết nối
            </h4>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">Server:</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted/50 px-3 py-1 rounded font-mono font-semibold">
                    {serverAddress}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(serverAddress, 'Server')}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {session.rdp_user && (
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium">Username:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted/50 px-3 py-1 rounded font-mono font-semibold">{session.rdp_user}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(session.rdp_user!, 'Username')}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {session.rdp_password && (
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium">Password:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted/50 px-3 py-1 rounded font-mono font-semibold">{session.rdp_password}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(session.rdp_password!, 'Password')}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Info Box - Only show when all 3 values are present */}
        {hasFullInfo && (
          <div className="p-6 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border-2 border-green-500/30 rounded-xl shadow-lg shadow-green-500/10 space-y-4 hover-scale transition-all duration-300">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-green-600 dark:text-green-400">
                ✅ VPS Đã Sẵn Sàng
              </h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllInfo}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy All
                </Button>
                {session.os_type === 'ubuntu' ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={copySSHCommand}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy SSH Command
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={downloadRDPFile}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Tải RDP
                  </Button>
                )}
              </div>
            </div>
            
            {/* Hướng dẫn quan trọng */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                ⚠️ Hướng dẫn kết nối VPS
              </p>
              {session.networking_type === 'ngrok' ? (
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>✅ Không cần cài Tailscale - truy cập trực tiếp qua Ngrok URL</li>
                  {session.os_type === 'ubuntu' ? (
                    <>
                      <li>Nhấn "Copy SSH Command" → lệnh SSH tự động copy vào clipboard</li>
                      <li>Mở CMD/Terminal → Paste lệnh (Ctrl+V hoặc Cmd+V) → Enter</li>
                      <li>Nhập password khi được hỏi (copy password bên dưới)</li>
                    </>
                  ) : (
                    <>
                      <li>Nhấn "Tải RDP" → mật khẩu tự động copy vào clipboard</li>
                      <li>Mở file .rdp → khi hỏi password, Paste (Ctrl+V)</li>
                      <li><strong>Nếu paste không được:</strong> gõ thủ công password bên dưới</li>
                    </>
                  )}
                </ol>
              ) : (
                session.os_type === 'ubuntu' ? (
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Cài Tailscale: <a href="https://tailscale.com/download" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">tailscale.com/download</a> và đăng nhập</li>
                    <li>Nhấn "Copy SSH Command" → lệnh SSH tự động copy vào clipboard</li>
                    <li>Mở CMD/Terminal → Paste lệnh (Ctrl+V hoặc Cmd+V) → Enter</li>
                    <li>Nhập password khi được hỏi (copy password bên dưới)</li>
                  </ol>
                ) : (
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Cài Tailscale: <a href="https://tailscale.com/download" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">tailscale.com/download</a> và đăng nhập</li>
                    <li>Nhấn "Tải RDP" → mật khẩu tự động copy vào clipboard</li>
                    <li>Mở file .rdp → khi hỏi password, Paste (Ctrl+V)</li>
                    <li><strong>Nếu paste không được:</strong> gõ thủ công password bên dưới</li>
                  </ol>
                )
              )}
            </div>
            
            <div className="text-sm space-y-2">
              <p className="text-muted-foreground font-semibold">Thông tin kết nối:</p>
              <div className="bg-background/50 p-3 rounded font-mono text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Server:</span>
                  <span className="font-semibold">{serverAddress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-semibold">{session.rdp_user}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-green-600 dark:text-green-400 select-all">{session.rdp_password}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(session.rdp_password!, 'Password')}
                      className="h-6 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">💡 {session.networking_type === 'ngrok' ? 'Ngrok public URL - truy cập trực tiếp không cần VPN' : 'Nếu paste không được, click-chọn password trên → gõ thủ công vào RDP'}</p>
            </div>
          </div>
        )}

        {/* Session Details */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/5 rounded-lg">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">Thời hạn:</span>
          </div>
          <span className="font-mono font-semibold text-foreground">{session.duration_hours}h</span>

          {timeRemaining && (
            <>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Clock className="h-4 w-4 text-green-500 animate-pulse" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Còn lại:</span>
              </div>
              <span className="font-mono font-semibold text-green-500">{timeRemaining}</span>
            </>
          )}

          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/5 rounded-lg">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">Tạo lúc:</span>
          </div>
          <span className="font-mono text-sm text-foreground">{new Date(session.created_at).toLocaleString('vi-VN')}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t-2 border-border/30">
          {session.is_active ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleKillVPS}
              disabled={isKilling}
              className="flex-1 shadow-lg shadow-destructive/20 hover:shadow-xl hover:shadow-destructive/30 transition-all duration-300 font-semibold"
            >
              {isKilling ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Đang tắt...
                </>
              ) : (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Tắt VPS
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleStartVPS}
              disabled={isStarting}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 font-semibold"
            >
              {isStarting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Đang khởi động...
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Khởi động lại
                </>
              )}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="border-2 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-all duration-300 font-semibold"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Logs Dialog */}
    <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>VPS Monitoring Logs</DialogTitle>
        </DialogHeader>
        <VPSSessionMonitor sessionId={session.id} sessionName={session.github_repo} />
      </DialogContent>
    </Dialog>
    </>
  );
}
