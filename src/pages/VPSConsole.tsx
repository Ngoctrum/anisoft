import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Server, Clock, User, Key, ExternalLink, Play, Terminal, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import workflowTemplate from '@/assets/windows-rdp-workflow.yml?raw';

interface VPSInfo {
  ip?: string;
  user?: string;
  password?: string;
  port?: string;
  startTime?: string;
  status: 'idle' | 'creating' | 'running' | 'failed';
  logs: string[];
  repoUrl?: string;
  workflowUrl?: string;
  uptimeSeconds?: number;
}

export default function VPSConsole() {
  const [githubToken, setGithubToken] = useState('');
  const [ngrokToken, setNgrokToken] = useState('');
  const [repoInfo, setRepoInfo] = useState<{ owner: string; name: string; url: string } | null>(null);
  const [vpsInfo, setVpsInfo] = useState<VPSInfo>({
    status: 'idle',
    logs: [],
    uptimeSeconds: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [waitingForSecret, setWaitingForSecret] = useState(false);

  const createRepository = async (token: string) => {
    const repoName = `windows-rdp-${Date.now()}`;
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: 'Windows RDP Server via GitHub Actions & Ngrok',
        private: false,
        auto_init: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create repository');
    }

    return await response.json();
  };

  const prepareWorkflow = () => {
    // Replace Tailscale with Ngrok setup and remove Websockify
    let modifiedWorkflow = workflowTemplate;
    
    // Replace Tailscale section with Ngrok
    const ngrokSetup = `
      # NGROK PREMIUM
      - name: 🌐 THIẾT LẬP KẾT NỐI NGROK
        env:
          NGROK_AUTH_TOKEN: \${{ secrets.NGROK_AUTH_TOKEN }}
        run: |
          Write-Host ""
          Write-Host "🌐 ĐANG THIẾT LẬP NGROK..." -ForegroundColor Yellow
          
          # Download và cài đặt Ngrok
          try {
              $ngrokZip = "$env:TEMP\\ngrok.zip"
              Invoke-WebRequest -Uri "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip" -OutFile $ngrokZip
              Expand-Archive -Path $ngrokZip -DestinationPath "$env:TEMP\\ngrok" -Force
              Remove-Item $ngrokZip -Force -ErrorAction SilentlyContinue
              Write-Host "│ ✅ Cài đặt Ngrok thành công" -ForegroundColor Green
          } catch {
              Write-Host "│ ❌ Lỗi cài đặt Ngrok: $($_.Exception.Message)" -ForegroundColor Red
              exit 1
          }
          
          # Xác thực Ngrok
          try {
              & "$env:TEMP\\ngrok\\ngrok.exe" config add-authtoken $env:NGROK_AUTH_TOKEN
              Write-Host "│ ✅ Xác thực Ngrok thành công" -ForegroundColor Green
          } catch {
              Write-Host "│ ❌ Lỗi xác thực Ngrok" -ForegroundColor Red
              exit 1
          }
          
          # Start Ngrok tunnel cho RDP (port 3389)
          Start-Process -FilePath "$env:TEMP\\ngrok\\ngrok.exe" -ArgumentList "tcp", "3389", "--log=stdout" -RedirectStandardOutput "$env:TEMP\\ngrok.log" -NoNewWindow
          
          Write-Host "🔄 Đang khởi động Ngrok tunnel..." -ForegroundColor Blue
          Start-Sleep -Seconds 15
          
          # Lấy thông tin tunnel từ Ngrok API với retry
          $maxRetries = 10
          $retryCount = 0
          $tunnelInfo = $null
          
          while ($retryCount -lt $maxRetries) {
              try {
                  $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
                  $tunnel = $ngrokApi.tunnels[0]
                  
                  if ($tunnel -and $tunnel.public_url) {
                      $tunnelInfo = $tunnel
                      break
                  }
              } catch {
                  Write-Host "│ ⏳ Chờ Ngrok API... (Thử $($retryCount + 1)/$maxRetries)" -ForegroundColor Yellow
              }
              
              Start-Sleep -Seconds 3
              $retryCount++
          }
          
          if (-not $tunnelInfo) {
              Write-Host "│ ❌ Không thể lấy thông tin từ Ngrok API" -ForegroundColor Red
              Write-Host "│ 💡 Kiểm tra log: Get-Content $env:TEMP\\ngrok.log" -ForegroundColor Yellow
              exit 1
          }
          
          $publicUrl = $tunnelInfo.public_url
          
          # Parse địa chỉ và port từ URL (tcp://x.tcp.ngrok.io:12345)
          if ($publicUrl -match 'tcp://([^:]+):(\\d+)') {
              $ngrokHost = $matches[1]
              $ngrokPort = $matches[2]
              
              echo "NGROK_HOST=$ngrokHost" >> $env:GITHUB_ENV
              echo "NGROK_PORT=$ngrokPort" >> $env:GITHUB_ENV
              echo "VPS_IP=$ngrokHost" >> $env:GITHUB_ENV
              echo "VPS_PORT=$ngrokPort" >> $env:GITHUB_ENV
              
              Write-Host "✅ Ngrok URL: $publicUrl" -ForegroundColor Green
              Write-Host "│ 🌐 Host: $ngrokHost" -ForegroundColor Cyan
              Write-Host "│ 🔌 Port: $ngrokPort" -ForegroundColor Cyan
          } else {
              Write-Host "│ ❌ Không thể parse Ngrok URL: $publicUrl" -ForegroundColor Red
              exit 1
          }`;
    
    // Replace the Tailscale section
    modifiedWorkflow = modifiedWorkflow.replace(
      /# TAILSCALE PREMIUM[\s\S]*?(?=# HIỂN THỊ GIAO DIỆN ĐẸP)/,
      ngrokSetup + '\n\n      '
    );
    
    // Update connection info display
    modifiedWorkflow = modifiedWorkflow.replace(
      /│ 🌐  Địa chỉ: \$env:TAILSCALE_IP/,
      '│ 🌐  Host: $env:NGROK_HOST:$env:NGROK_PORT'
    );
    
    modifiedWorkflow = modifiedWorkflow.replace(
      /│   2. Nhập: \$env:TAILSCALE_IP/,
      '│   2. Nhập: $env:NGROK_HOST:$env:NGROK_PORT'
    );
    
    modifiedWorkflow = modifiedWorkflow.replace(
      /🔗 Kết nối: \$env:TAILSCALE_IP/,
      '🔗 Kết nối: $env:NGROK_HOST:$env:NGROK_PORT'
    );
    
    return modifiedWorkflow;
  };

  const uploadWorkflowFile = async (token: string, owner: string, repo: string) => {
    const path = '.github/workflows/windows-rdp.yml';
    const workflowContent = prepareWorkflow();
    const encodedContent = btoa(unescape(encodeURIComponent(workflowContent)));

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Add Windows RDP workflow with Ngrok',
        content: encodedContent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload workflow file');
    }

    return await response.json();
  };

  const addSecretInstructions = (repoUrl: string, ngrokToken: string) => {
    const instructions = `
📋 HƯỚNG DẪN THÊM NGROK TOKEN:

Bước 1: Mở link này (nó sẽ mở repo settings):
  ${repoUrl}/settings/secrets/actions

Bước 2: Nhấn nút "New repository secret" (màu xanh)

Bước 3: Điền thông tin:
  - Name: NGROK_AUTH_TOKEN
  - Secret: ${ngrokToken}

Bước 4: Nhấn "Add secret"

Bước 5: Quay lại đây và nhấn nút "Trigger Workflow" ở trên ⬆️

✅ Xong! Hệ thống sẽ tự động tạo VPS.
    `.trim();
    
    return instructions;
  };

  const triggerWorkflow = async (token: string, owner: string, repo: string) => {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/windows-rdp.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            duration: '5h40m',
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to trigger workflow');
    }
  };

  const monitorWorkflow = async (token: string, owner: string, repo: string) => {
    let attempts = 0;
    const maxAttempts = 100;

    const checkStatus = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        const latestRun = data.workflow_runs?.[0];

        if (!latestRun) {
          setVpsInfo((prev) => ({
            ...prev,
            logs: [...prev.logs, '⏳ Đang chờ workflow khởi động...'],
          }));
          return false;
        }

        setVpsInfo((prev) => ({
          ...prev,
          logs: [...prev.logs, `📊 Workflow: ${latestRun.status} - ${latestRun.conclusion || 'đang chạy'}`],
          workflowUrl: latestRun.html_url,
        }));

        if (latestRun.status === 'in_progress') {
          // Try to extract info from logs
          await extractVPSInfoFromLogs(token, owner, repo, latestRun.id);
        }

        if (latestRun.status === 'completed') {
          if (latestRun.conclusion === 'success') {
            await extractVPSInfoFromLogs(token, owner, repo, latestRun.id);
            setVpsInfo((prev) => ({ 
              ...prev, 
              status: 'running',
              startTime: new Date().toISOString(),
            }));
            return true;
          } else {
            setVpsInfo((prev) => ({
              ...prev,
              status: 'failed',
              logs: [...prev.logs, '❌ Workflow thất bại. Kiểm tra GitHub Actions để biết chi tiết.'],
            }));
            return true;
          }
        }

        return false;
      } catch (error) {
        console.error('Error checking workflow status:', error);
        return false;
      }
    };

    while (attempts < maxAttempts) {
      const completed = await checkStatus();
      if (completed) break;

      await new Promise((resolve) => setTimeout(resolve, 15000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      setVpsInfo((prev) => ({
        ...prev,
        status: 'failed',
        logs: [...prev.logs, '⏰ Timeout: Workflow quá lâu không hoàn thành.'],
      }));
    }
  };

  const extractVPSInfoFromLogs = async (token: string, owner: string, repo: string, runId: number) => {
    try {
      // Get jobs for this run
      const jobsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const jobsData = await jobsResponse.json();
      const job = jobsData.jobs?.[0];

      if (!job) return;

      // Try to download logs
      try {
        const logsResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/logs`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (logsResponse.ok) {
          const logsBlob = await logsResponse.blob();
          const logsText = await logsBlob.text();
          
          // Extract info from logs - look for various patterns
          const hostMatch = logsText.match(/(?:NGROK_HOST|VPS_IP)=([^\s\r\n]+)/);
          const portMatch = logsText.match(/(?:NGROK_PORT|VPS_PORT)=(\d+)/);
          
          // Look for password in different formats
          let passwordMatch = logsText.match(/Mật khẩu:\s*([^\s\r\n]+)/);
          if (!passwordMatch) {
            passwordMatch = logsText.match(/RDP_PASS=([^\s\r\n]+)/);
          }
          if (!passwordMatch) {
            passwordMatch = logsText.match(/Password:\s*([^\s\r\n]+)/);
          }
          
          // Look for username
          let userMatch = logsText.match(/Tài khoản:\s*([^\s\r\n]+)/);
          if (!userMatch) {
            userMatch = logsText.match(/RDP_USER=([^\s\r\n]+)/);
          }

          const host = hostMatch?.[1];
          const port = portMatch?.[1];
          
          if (host && port) {
            setVpsInfo((prev) => ({
              ...prev,
              ip: host,
              port: port,
              user: userMatch?.[1] || 'AISTV-PREMIUM',
              password: passwordMatch?.[1] || 'Xem trong GitHub Actions logs',
              logs: [...prev.logs, '✅ Đã lấy được thông tin kết nối từ workflow!', `🔑 Host: ${host}:${port}`],
            }));
          }
        }
      } catch (logError) {
        console.log('Could not fetch detailed logs yet, will retry...');
      }
    } catch (error) {
      console.error('Error extracting VPS info:', error);
    }
  };

  const handleTriggerWorkflow = async () => {
    if (!repoInfo) {
      toast.error('Không tìm thấy thông tin repository');
      return;
    }

    setIsProcessing(true);
    setWaitingForSecret(false);
    setVpsInfo((prev) => ({ ...prev, status: 'creating', logs: [...prev.logs, '▶️ Đang khởi động workflow...'] }));

    try {
      await triggerWorkflow(githubToken, repoInfo.owner, repoInfo.name);
      setVpsInfo((prev) => ({ ...prev, logs: [...prev.logs, '✅ Workflow đã được kích hoạt!'] }));

      setVpsInfo((prev) => ({ ...prev, logs: [...prev.logs, '👀 Đang theo dõi tiến trình...'] }));
      await monitorWorkflow(githubToken, repoInfo.owner, repoInfo.name);

      toast.success('🎉 Windows RDP Server đã sẵn sàng!');
    } catch (error: any) {
      console.error('Error triggering workflow:', error);
      toast.error(error.message || 'Có lỗi xảy ra');
      setVpsInfo((prev) => ({
        ...prev,
        status: 'failed',
        logs: [...prev.logs, `❌ Lỗi: ${error.message}`],
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateVPS = async () => {
    if (!githubToken.trim()) {
      toast.error('Vui lòng nhập GitHub Token');
      return;
    }

    if (!ngrokToken.trim()) {
      toast.error('Vui lòng nhập Ngrok Auth Token');
      return;
    }

    setIsProcessing(true);
    setVpsInfo({ status: 'creating', logs: ['🚀 Bắt đầu tạo Windows RDP Server...'] });

    try {
      // Step 1: Create repository
      setVpsInfo((prev) => ({ ...prev, logs: [...prev.logs, '📦 Đang tạo GitHub repository...'] }));
      const repo = await createRepository(githubToken);
      
      setVpsInfo((prev) => ({
        ...prev,
        logs: [...prev.logs, `✅ Repository: ${repo.full_name}`],
        repoUrl: repo.html_url,
      }));

      // Save repo info for later
      setRepoInfo({
        owner: repo.owner.login,
        name: repo.name,
        url: repo.html_url,
      });

      // Step 2: Upload workflow
      setVpsInfo((prev) => ({ ...prev, logs: [...prev.logs, '📄 Đang upload workflow file...'] }));
      await uploadWorkflowFile(githubToken, repo.owner.login, repo.name);
      setVpsInfo((prev) => ({ ...prev, logs: [...prev.logs, '✅ Workflow đã sẵn sàng'] }));

      // Step 3: Show instructions to add secret
      const secretInstructions = addSecretInstructions(repo.html_url, ngrokToken);
      setVpsInfo((prev) => ({ 
        ...prev, 
        logs: [...prev.logs, '📋 HƯỚNG DẪN THÊM SECRET:', '', secretInstructions, '', '⬇️ Sau khi thêm xong, nhấn nút "Trigger Workflow" bên dưới'],
        status: 'idle',
        repoUrl: repo.html_url,
      }));
      
      setWaitingForSecret(true);
      toast.info('Vui lòng thêm Ngrok Token vào Repository Settings!', { duration: 10000 });

      // Step 3: Upload workflow (removed secret creation)
      setVpsInfo((prev) => ({ ...prev, logs: [...prev.logs, '📄 Đang upload workflow file...'] }));
      await uploadWorkflowFile(githubToken, repo.owner.login, repo.name);
      setVpsInfo((prev) => ({ ...prev, logs: [...prev.logs, '✅ Workflow đã sẵn sàng'] }));

      // Wait for workflow to be registered
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Step 4: Trigger workflow (removed)
      // User will trigger manually after adding secret
    } catch (error: any) {
      console.error('Error creating VPS:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo VPS');
      setVpsInfo((prev) => ({
        ...prev,
        status: 'failed',
        logs: [...prev.logs, `❌ Lỗi: ${error.message}`],
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    switch (vpsInfo.status) {
      case 'idle':
        return <Badge variant="secondary" className="gap-1"><Terminal className="h-3 w-3" />Chưa khởi tạo</Badge>;
      case 'creating':
        return <Badge className="bg-blue-500 gap-1"><Loader2 className="h-3 w-3 animate-spin" />Đang tạo...</Badge>;
      case 'running':
        return <Badge className="bg-green-500 gap-1"><Wifi className="h-3 w-3" />Đang chạy</Badge>;
      case 'failed':
        return <Badge variant="destructive">Lỗi</Badge>;
    }
  };

  const formatUptime = () => {
    if (!vpsInfo.startTime) return '0:00:00';
    const diff = Math.floor((Date.now() - new Date(vpsInfo.startTime).getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (vpsInfo.status === 'running') {
      interval = setInterval(() => {
        setVpsInfo((prev) => ({ ...prev }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [vpsInfo.status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
              <Server className="h-10 w-10 text-primary" />
              VPS Console
            </h1>
            <p className="text-muted-foreground mt-2">
              Tự động tạo Windows RDP Server qua GitHub Actions + Ngrok
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Cấu hình Token
              </CardTitle>
              <CardDescription>Nhập GitHub Token và Ngrok Token để tạo VPS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                <Input
                  id="github-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Cần quyền: <code className="bg-muted px-1 rounded">repo</code>, <code className="bg-muted px-1 rounded">workflow</code>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ngrok-token">Ngrok Auth Token</Label>
                <Input
                  id="ngrok-token"
                  type="password"
                  placeholder="2xxx_xxx..."
                  value={ngrokToken}
                  onChange={(e) => setNgrokToken(e.target.value)}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Lấy token tại: <a href="https://dashboard.ngrok.com/get-started/your-authtoken" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ngrok Dashboard</a>
                </p>
              </div>

              <Button
                onClick={handleCreateVPS}
                disabled={isProcessing || vpsInfo.status === 'running' || waitingForSecret}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Tạo Windows RDP Server
                  </>
                )}
              </Button>

              {waitingForSecret && (
                <Button
                  onClick={handleTriggerWorkflow}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang khởi động...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Trigger Workflow (Sau khi thêm secret)
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Thông tin RDP Server
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vpsInfo.status === 'running' && vpsInfo.ip && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Uptime
                      </div>
                      <div className="text-2xl font-mono font-bold text-green-500">{formatUptime()}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wifi className="h-4 w-4" />
                        Status
                      </div>
                      <Badge className="bg-green-500">Online</Badge>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Server className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Host:</span>
                      </span>
                      <code className="bg-background/50 px-2 py-1 rounded text-xs">{vpsInfo.ip}</code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Server className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Port:</span>
                      </span>
                      <code className="bg-background/50 px-2 py-1 rounded text-xs">{vpsInfo.port || '3389'}</code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Username:</span>
                      </span>
                      <code className="bg-background/50 px-2 py-1 rounded text-xs">{vpsInfo.user}</code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Key className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Password:</span>
                      </span>
                      <code className="bg-background/50 px-2 py-1 rounded text-xs">{vpsInfo.password}</code>
                    </div>
                  </div>

                  <Alert className="bg-primary/5 border-primary/30">
                    <AlertDescription className="text-sm">
                      💡 <strong>Hướng dẫn kết nối:</strong><br/>
                      1. Mở <strong>Remote Desktop Connection</strong><br/>
                      2. Nhập: <code className="bg-background/50 px-1 rounded">{vpsInfo.ip}:{vpsInfo.port}</code><br/>
                      3. Username & Password như trên ⬆️
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {vpsInfo.status === 'idle' && !waitingForSecret && (
                <Alert>
                  <AlertDescription className="text-center py-8">
                    <Terminal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>Nhập GitHub Token và Ngrok Token để bắt đầu</p>
                  </AlertDescription>
                </Alert>
              )}

              {waitingForSecret && (
                <Alert className="bg-yellow-500/10 border-yellow-500/30">
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold text-yellow-600 dark:text-yellow-400">⚠️ Cần thêm Ngrok Token vào Repository</p>
                      <p className="text-sm">Xem hướng dẫn chi tiết ở phần <strong>Live Logs</strong> bên dưới ⬇️</p>
                      <p className="text-sm">Sau khi thêm xong, nhấn nút <strong>"Trigger Workflow"</strong> ở trên ⬆️</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {(vpsInfo.status === 'creating' || vpsInfo.status === 'failed') && (
                <Alert>
                  <AlertDescription className="flex items-center gap-2">
                    {vpsInfo.status === 'creating' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tạo Windows RDP Server...
                      </>
                    ) : (
                      '❌ Có lỗi xảy ra, vui lòng kiểm tra logs bên dưới'
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {vpsInfo.repoUrl && (
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <a href={vpsInfo.repoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Xem Repository
                  </a>
                </Button>
              )}

              {vpsInfo.workflowUrl && (
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <a href={vpsInfo.workflowUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Xem GitHub Actions
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Live Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black/95 text-green-400 p-4 rounded-lg font-mono text-xs h-[350px] overflow-y-auto space-y-1">
              {vpsInfo.logs.length === 0 ? (
                <div className="text-muted-foreground flex items-center justify-center h-full">
                  <div className="text-center">
                    <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Waiting for logs...</p>
                  </div>
                </div>
              ) : (
                vpsInfo.logs.map((log, idx) => (
                  <div key={idx} className="hover:bg-white/5 px-1 rounded transition-colors">
                    <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    <span>{log}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
