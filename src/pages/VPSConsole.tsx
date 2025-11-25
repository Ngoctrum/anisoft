import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Server, Clock, User, Key, ExternalLink, Play, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface VPSInfo {
  ip?: string;
  user?: string;
  password?: string;
  consoleUrl?: string;
  startTime?: string;
  status: 'idle' | 'creating' | 'running' | 'failed';
  logs: string[];
  repoUrl?: string;
  workflowUrl?: string;
}

export default function VPSConsole() {
  const [githubToken, setGithubToken] = useState('');
  const [workflowYaml, setWorkflowYaml] = useState('');
  const [vpsInfo, setVpsInfo] = useState<VPSInfo>({
    status: 'idle',
    logs: [],
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const createRepository = async (token: string) => {
    const repoName = `vps-windows-${Date.now()}`;
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: 'Auto-generated Windows VPS via GitHub Actions',
        private: false,
        auto_init: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create repository');
    }

    return await response.json();
  };

  const uploadWorkflowFile = async (token: string, owner: string, repo: string, content: string) => {
    const path = '.github/workflows/windows-vps.yml';
    const encodedContent = btoa(content);

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Add Windows VPS workflow',
        content: encodedContent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload workflow file');
    }

    return await response.json();
  };

  const triggerWorkflow = async (token: string, owner: string, repo: string) => {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/windows-vps.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to trigger workflow');
    }
  };

  const monitorWorkflow = async (token: string, owner: string, repo: string) => {
    let attempts = 0;
    const maxAttempts = 60;

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
            logs: [...prev.logs, 'Waiting for workflow to start...'],
          }));
          return false;
        }

        setVpsInfo((prev) => ({
          ...prev,
          logs: [...prev.logs, `Workflow status: ${latestRun.status} - ${latestRun.conclusion || 'in progress'}`],
          workflowUrl: latestRun.html_url,
        }));

        if (latestRun.status === 'completed') {
          if (latestRun.conclusion === 'success') {
            await extractVPSInfo(token, owner, repo, latestRun.id);
            setVpsInfo((prev) => ({ ...prev, status: 'running' }));
            return true;
          } else {
            setVpsInfo((prev) => ({
              ...prev,
              status: 'failed',
              logs: [...prev.logs, 'Workflow failed. Check GitHub Actions for details.'],
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

      await new Promise((resolve) => setTimeout(resolve, 10000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      setVpsInfo((prev) => ({
        ...prev,
        status: 'failed',
        logs: [...prev.logs, 'Timeout: Workflow took too long to complete.'],
      }));
    }
  };

  const extractVPSInfo = async (token: string, owner: string, repo: string, runId: number) => {
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
        const logsText = await logsResponse.text();
        
        const ipMatch = logsText.match(/VPS_IP[:=]\s*(\S+)/);
        const userMatch = logsText.match(/VPS_USER[:=]\s*(\S+)/);
        const passMatch = logsText.match(/VPS_PASSWORD[:=]\s*(\S+)/);
        const consoleMatch = logsText.match(/CONSOLE_URL[:=]\s*(\S+)/);

        setVpsInfo((prev) => ({
          ...prev,
          ip: ipMatch?.[1] || 'Not found',
          user: userMatch?.[1] || 'Administrator',
          password: passMatch?.[1] || 'Check logs',
          consoleUrl: consoleMatch?.[1],
          startTime: new Date().toISOString(),
          logs: [...prev.logs, 'VPS created successfully!', logsText.substring(0, 500)],
        }));
      }
    } catch (error) {
      console.error('Error extracting VPS info:', error);
    }
  };

  const handleCreateVPS = async () => {
    if (!githubToken.trim()) {
      toast.error('Vui lòng nhập GitHub Token');
      return;
    }

    if (!workflowYaml.trim()) {
      toast.error('Vui lòng nhập nội dung Workflow YAML');
      return;
    }

    setIsProcessing(true);
    setVpsInfo({ status: 'creating', logs: ['Starting VPS creation...'] });

    try {
      setVpsInfo((prev) => ({ ...prev, logs: [...prev.logs, 'Creating GitHub repository...'] }));
      const repo = await createRepository(githubToken);
      
      setVpsInfo((prev) => ({
        ...prev,
        logs: [...prev.logs, `Repository created: ${repo.full_name}`],
        repoUrl: repo.html_url,
      }));

      setVpsInfo((prev) => ({ ...prev, logs: [...prev.logs, 'Uploading workflow file...'] }));
      await uploadWorkflowFile(githubToken, repo.owner.login, repo.name, workflowYaml);
      
      setVpsInfo((prev) => ({ ...prev, logs: [...prev.logs, 'Workflow uploaded successfully'] }));

      await new Promise((resolve) => setTimeout(resolve, 3000));

      setVpsInfo((prev) => ({ ...prev, logs: [...prev.logs, 'Triggering workflow...'] }));
      await triggerWorkflow(githubToken, repo.owner.login, repo.name);
      
      setVpsInfo((prev) => ({ ...prev, logs: [...prev.logs, 'Workflow triggered, monitoring status...'] }));

      await monitorWorkflow(githubToken, repo.owner.login, repo.name);

      toast.success('VPS được tạo thành công!');
    } catch (error: any) {
      console.error('Error creating VPS:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo VPS');
      setVpsInfo((prev) => ({
        ...prev,
        status: 'failed',
        logs: [...prev.logs, `Error: ${error.message}`],
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    switch (vpsInfo.status) {
      case 'idle':
        return <Badge variant="secondary">Chưa khởi tạo</Badge>;
      case 'creating':
        return <Badge className="bg-blue-500">Đang tạo...</Badge>;
      case 'running':
        return <Badge className="bg-green-500">Đang chạy</Badge>;
      case 'failed':
        return <Badge variant="destructive">Lỗi</Badge>;
    }
  };

  const formatUptime = () => {
    if (!vpsInfo.startTime) return '0:00:00';
    const diff = Date.now() - new Date(vpsInfo.startTime).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              VPS Console
            </h1>
            <p className="text-muted-foreground mt-2">
              Tự động tạo Windows VPS qua GitHub Actions
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Cấu hình VPS
              </CardTitle>
              <CardDescription>Nhập thông tin để tạo VPS tự động</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">GitHub Personal Access Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Token cần quyền: repo, workflow
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflow">Windows Workflow YAML</Label>
                <Textarea
                  id="workflow"
                  placeholder="Paste your workflow YAML here..."
                  value={workflowYaml}
                  onChange={(e) => setWorkflowYaml(e.target.value)}
                  disabled={isProcessing}
                  className="min-h-[200px] font-mono text-xs"
                />
              </div>

              <Button
                onClick={handleCreateVPS}
                disabled={isProcessing || vpsInfo.status === 'running'}
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
                    Tạo VPS
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Thông tin VPS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vpsInfo.status === 'running' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Uptime
                      </div>
                      <div className="text-2xl font-mono font-bold">{formatUptime()}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Server className="h-4 w-4" />
                        IP Address
                      </div>
                      <div className="text-lg font-mono">{vpsInfo.ip || 'Loading...'}</div>
                    </div>
                  </div>

                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Username:</span>
                      <code className="ml-auto">{vpsInfo.user}</code>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Key className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Password:</span>
                      <code className="ml-auto">{vpsInfo.password}</code>
                    </div>
                  </div>

                  {vpsInfo.consoleUrl && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={vpsInfo.consoleUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Mở Console
                      </a>
                    </Button>
                  )}
                </>
              )}

              {vpsInfo.status === 'idle' && (
                <Alert>
                  <AlertDescription>
                    Nhập GitHub Token và Workflow YAML để bắt đầu
                  </AlertDescription>
                </Alert>
              )}

              {(vpsInfo.status === 'creating' || vpsInfo.status === 'failed') && (
                <Alert>
                  <AlertDescription className="flex items-center gap-2">
                    {vpsInfo.status === 'creating' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tạo VPS...
                      </>
                    ) : (
                      'Có lỗi xảy ra, vui lòng kiểm tra logs'
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Live Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black/90 text-green-400 p-4 rounded-lg font-mono text-xs h-[300px] overflow-y-auto">
              {vpsInfo.logs.length === 0 ? (
                <div className="text-muted-foreground">Waiting for logs...</div>
              ) : (
                vpsInfo.logs.map((log, idx) => (
                  <div key={idx} className="mb-1">
                    <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span> {log}
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
