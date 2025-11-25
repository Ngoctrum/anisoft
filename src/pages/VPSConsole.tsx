import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Server, Play, Terminal, ExternalLink, Key, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { RDPSessionCard } from '@/components/RDPSessionCard';
import workflowTemplate from '@/assets/windows-rdp-workflow.yml?raw';

interface Session {
  id: string;
  github_repo: string;
  repo_url?: string;
  tailscale_ip?: string;
  rdp_user?: string;
  rdp_password?: string;
  status: string;
  created_at: string;
  expires_at?: string;
}

export default function VPSConsole() {
  const [githubToken, setGithubToken] = useState('');
  const [ngrokToken, setNgrokToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // Load existing sessions
  useEffect(() => {
    loadSessions();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('rdp-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rdp_sessions',
        },
        (payload) => {
          console.log('Realtime update:', payload);
          loadSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSessions = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('rdp_sessions')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('rdp_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      toast.success('Đã xóa session');
      await loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Không thể xóa session');
    }
  };

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

  const uploadWorkflowFile = async (token: string, owner: string, repo: string) => {
    const path = '.github/workflows/windows-rdp.yml';
    const encodedContent = btoa(unescape(encodeURIComponent(workflowTemplate)));

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

  const getSecretInstructions = (repoUrl: string, ngrokToken: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    return `
📋 CẦN THÊM 3 SECRETS VÀO REPOSITORY:

Bước 1: Mở Repository Settings → Secrets and variables → Actions
Link: ${repoUrl}/settings/secrets/actions

Bước 2: Nhấn "New repository secret" và thêm lần lượt 3 secrets sau:

Secret 1:
  Name: NGROK_AUTH_TOKEN
  Value: ${ngrokToken}

Secret 2:
  Name: SUPABASE_URL
  Value: ${supabaseUrl}

Secret 3:
  Name: SUPABASE_ANON_KEY
  Value: ${supabaseKey}

Bước 3: Sau khi thêm đủ 3 secrets, vào tab "Actions" của repo và chạy workflow "SEVER AI STV PREMIUM" thủ công.

✅ Xong! VPS sẽ tự động gửi thông tin về website sau 5-10 phút.
    `.trim();
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
    setLogs(['🚀 Bắt đầu tạo Windows RDP Server...']);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Bạn cần đăng nhập để sử dụng tính năng này');
      }

      // Step 1: Create repository
      setLogs((prev) => [...prev, '📦 Đang tạo GitHub repository...']);
      const repo = await createRepository(githubToken);
      
      setLogs((prev) => [...prev, `✅ Repository: ${repo.full_name}`]);

      // Step 2: Create session in database
      setLogs((prev) => [...prev, '💾 Đang lưu session vào database...']);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 5, expiresAt.getMinutes() + 40);

      const { data: session, error: sessionError } = await supabase
        .from('rdp_sessions')
        .insert({
          user_id: userData.user.id,
          github_repo: repo.name,
          repo_url: repo.html_url,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setLogs((prev) => [...prev, '✅ Session đã được tạo']);

      // Step 3: Upload workflow
      setLogs((prev) => [...prev, '📄 Đang upload workflow file...']);
      await uploadWorkflowFile(githubToken, repo.owner.login, repo.name);
      setLogs((prev) => [...prev, '✅ Workflow đã sẵn sàng']);

      // Step 4: Show instructions to add secrets manually
      const instructions = getSecretInstructions(repo.html_url, ngrokToken);
      setLogs((prev) => [...prev, '', '🔐 CẦN THÊM SECRETS THỦ CÔNG:', '', ...instructions.split('\n')]);

      toast.info('📋 Vui lòng thêm 3 secrets vào Repository theo hướng dẫn!', { duration: 10000 });
      
      // Reset form
      setGithubToken('');
      setNgrokToken('');
      
      // Reload sessions
      await loadSessions();
    } catch (error: any) {
      console.error('Error creating VPS:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo VPS');
      setLogs((prev) => [...prev, `❌ Lỗi: ${error.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

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
        </div>

        {/* Create VPS Form */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Tạo VPS Mới
            </CardTitle>
            <CardDescription>Nhập GitHub Token và Ngrok Token để tạo VPS tự động</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>

            <Button
              onClick={handleCreateVPS}
              disabled={isProcessing}
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

            {logs.length > 0 && (
              <div className="bg-black/95 text-green-400 p-4 rounded-lg font-mono text-xs max-h-[200px] overflow-y-auto space-y-1">
                {logs.map((log, idx) => (
                  <div key={idx} className="hover:bg-white/5 px-1 rounded transition-colors">
                    <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            VPS Sessions ({sessions.length})
          </h2>

          {sessions.length === 0 ? (
            <Alert>
              <AlertDescription className="text-center py-8">
                <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>Chưa có VPS nào. Tạo VPS đầu tiên của bạn ở trên ⬆️</p>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sessions.map((session) => (
                <div key={session.id} className="relative">
                  <RDPSessionCard session={session} />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa session này?')) {
                        deleteSession(session.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
