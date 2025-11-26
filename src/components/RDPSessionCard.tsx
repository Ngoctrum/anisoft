import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Server, User, Key, Copy, ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';

interface RDPSession {
  id: string;
  github_repo: string;
  repo_url?: string;
  tailscale_ip?: string; // Ngrok URL
  rdp_user?: string;
  rdp_password?: string;
  status: string;
  created_at: string;
  expires_at?: string;
}

interface RDPSessionCardProps {
  session: RDPSession;
}

export function RDPSessionCard({ session }: RDPSessionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

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

  const copyAllInfo = () => {
    const server = session.tailscale_ip?.replace(/^tcp:\/\//, '') || '';
    const info = `Server: ${server}\nUsername: ${session.rdp_user || ''}\nPassword: ${session.rdp_password || ''}`;
    navigator.clipboard.writeText(info);
    toast.success('Đã copy toàn bộ thông tin');
  };

  const downloadRDPFile = () => {
    const server = session.tailscale_ip?.replace(/^tcp:\/\//, '') || '';
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
    
    toast.success('Đã tải file RDP');
  };

  const getStatusColor = () => {
    switch (session.status) {
      case 'connected':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (session.status) {
      case 'connected':
        return 'Đang chạy';
      case 'pending':
        return 'Đang tạo';
      case 'failed':
        return 'Thất bại';
      default:
        return session.status;
    }
  };

  const hasFullInfo = session.tailscale_ip && session.rdp_user && session.rdp_password;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5" />
            {session.github_repo}
          </CardTitle>
          <Badge className={getStatusColor()}>{getStatusText()}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Repo Link */}
        {session.repo_url && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Repository:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(session.repo_url, '_blank')}
              className="gap-2"
            >
              GitHub <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Connection Info */}
        {session.tailscale_ip && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Server:</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-background px-2 py-1 rounded">
                  {session.tailscale_ip.replace(/^tcp:\/\//, '')}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(session.tailscale_ip!.replace(/^tcp:\/\//, ''), 'Server')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {session.rdp_user && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Username:</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-background px-2 py-1 rounded">{session.rdp_user}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(session.rdp_user!, 'Username')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {session.rdp_password && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Password:</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-background px-2 py-1 rounded">{session.rdp_password}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(session.rdp_password!, 'Password')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Full Info Box - Only show when all 3 values are present */}
        {hasFullInfo && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
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
                <Button
                  variant="default"
                  size="sm"
                  onClick={downloadRDPFile}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Tải RDP
                </Button>
              </div>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">Kết nối RDP với:</p>
              <div className="bg-background/50 p-3 rounded font-mono text-xs space-y-1">
                <div>Server: {session.tailscale_ip?.replace(/^tcp:\/\//, '')}</div>
                <div>Username: {session.rdp_user}</div>
                <div>Password: {session.rdp_password}</div>
              </div>
            </div>
          </div>
        )}

        {/* Time Remaining */}
        {timeRemaining && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thời gian còn lại:</span>
            </div>
            <span className="text-sm font-semibold">{timeRemaining}</span>
          </div>
        )}

        {/* Created At */}
        <div className="text-xs text-muted-foreground text-center">
          Tạo lúc: {new Date(session.created_at).toLocaleString('vi-VN')}
        </div>
      </CardContent>
    </Card>
  );
}
