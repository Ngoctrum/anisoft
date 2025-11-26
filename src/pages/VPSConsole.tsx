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
import _sodium from 'libsodium-wrappers';

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
  const [tailscaleToken, setTailscaleToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [savedGithubToken, setSavedGithubToken] = useState('');

  // Load saved tokens from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setSavedGithubToken(savedToken);
    }
  }, []);

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

  const deleteGithubRepo = async (repoUrl: string, token: string) => {
    try {
      // Extract owner and repo name from URL
      // Format: https://github.com/owner/repo
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL');
      }

      const [, owner, repo] = match;

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Repository already deleted or not found');
          return; // Don't throw error if repo doesn't exist
        }
        throw new Error(`Failed to delete repository: ${response.status}`);
      }

      console.log(`Successfully deleted repository: ${owner}/${repo}`);
    } catch (error) {
      console.error('Error deleting GitHub repo:', error);
      throw error;
    }
  };

  const deleteSession = async (sessionId: string, repoUrl?: string) => {
    if (!confirm('⚠️ Xóa session sẽ XÓA LUÔN REPOSITORY trên GitHub!\n\nBạn có chắc chắn muốn tiếp tục?')) {
      return;
    }

    const deletingToast = toast.loading('Đang xóa session và repository...');

    try {
      // Delete GitHub repository first if repo URL exists
      if (repoUrl && savedGithubToken) {
        try {
          await deleteGithubRepo(repoUrl, savedGithubToken);
          toast.loading('✅ Đã xóa GitHub repo. Đang xóa session...', { id: deletingToast });
        } catch (repoError) {
          console.error('Error deleting repo:', repoError);
          toast.warning('Không thể xóa GitHub repo, nhưng sẽ xóa session', { id: deletingToast });
        }
      }

      // Delete session from database
      const { error } = await supabase
        .from('rdp_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      toast.success('✅ Đã xóa session và repository thành công!', { id: deletingToast });
      await loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Không thể xóa session', { id: deletingToast });
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
        description: 'Windows RDP Server via GitHub Actions & Tailscale',
        private: false,
        auto_init: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 401) {
        throw new Error('❌ GitHub Token không hợp lệ!\n\n📋 Hướng dẫn tạo token:\n1. Vào https://github.com/settings/tokens/new\n2. Đặt tên token: "Lovable VPS Console"\n3. Chọn quyền: ✅ repo, ✅ workflow\n4. Click "Generate token"\n5. Copy token và paste vào đây');
      }
      
      if (response.status === 403) {
        throw new Error('❌ GitHub Token thiếu quyền!\n\nToken cần có quyền:\n✅ repo (full control)\n✅ workflow (update workflows)\n\nVào https://github.com/settings/tokens để cập nhật token.');
      }
      
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
        message: 'Add Windows RDP workflow with Tailscale',
        content: encodedContent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload workflow file');
    }

    return await response.json();
  };

  const addGithubSecret = async (token: string, owner: string, repo: string, secretName: string, secretValue: string) => {
    // Initialize libsodium
    await _sodium.ready;
    const sodium = _sodium;

    // Get repository public key
    const keyResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!keyResponse.ok) {
      throw new Error('Failed to get repository public key');
    }

    const { key, key_id } = await keyResponse.json();

    // Encrypt secret using libsodium sealed box
    const messageBytes = sodium.from_string(secretValue);
    const keyBytes = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    
    // Encrypt using sealed box (anonymous encryption)
    const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
    const encryptedValue = sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);

    // Add secret to repository
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secretName}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        encrypted_value: encryptedValue,
        key_id: key_id,
      }),
    });

    if (!response.ok && response.status !== 201 && response.status !== 204) {
      const errorData = await response.json();
      throw new Error(`Failed to add secret: ${errorData.message || response.statusText}`);
    }
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

  const fetchWorkflowLogs = async (token: string, owner: string, repo: string) => {
    try {
      // Get latest workflow run
      const runsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!runsResponse.ok) return;

      const { workflow_runs } = await runsResponse.json();
      if (!workflow_runs || workflow_runs.length === 0) return;

      const latestRun = workflow_runs[0];
      
      setLogs((prev) => [
        ...prev,
        `🎬 Workflow đang chạy: ${latestRun.status}`,
        `🔗 Xem chi tiết: ${latestRun.html_url}`,
      ]);

      // Get jobs for this run
      const jobsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs/${latestRun.id}/jobs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (jobsResponse.ok) {
        const { jobs } = await jobsResponse.json();
        jobs.forEach((job: any) => {
          setLogs((prev) => [
            ...prev,
            `📋 Job: ${job.name} - Status: ${job.status}`,
          ]);
        });
      }
    } catch (error) {
      console.error('Error fetching workflow logs:', error);
    }
  };

  const handleCreateVPS = async () => {
    if (!githubToken.trim()) {
      toast.error('Vui lòng nhập GitHub Token');
      return;
    }

    if (!tailscaleToken.trim()) {
      toast.error('Vui lòng nhập Tailscale Auth Token');
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

      // Step 4: Wait for workflow file to be committed
      setLogs((prev) => [...prev, '⏳ Đợi 5 giây để workflow được xử lý...']);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 5: Add Tailscale secret automatically
      setLogs((prev) => [...prev, '🔐 Đang thêm Tailscale Auth Key vào repository...']);
      try {
        await addGithubSecret(githubToken, repo.owner.login, repo.name, 'TAILSCALE_AUTH_KEY', tailscaleToken);
        setLogs((prev) => [...prev, '✅ Secret đã được thêm tự động!']);
      } catch (error: any) {
        setLogs((prev) => [...prev, '⚠️ Không thể thêm secret tự động, thử phương án khác...']);
        // Fallback: Continue anyway, user might add manually
      }

      // Step 6: Trigger workflow automatically
      setLogs((prev) => [...prev, '🚀 Đang trigger workflow tự động...']);
      await triggerWorkflow(githubToken, repo.owner.login, repo.name);
      setLogs((prev) => [...prev, '✅ Workflow đã được trigger!']);

      // Step 7: Start monitoring workflow logs
      setLogs((prev) => [...prev, '👀 Đang theo dõi workflow...']);
      await new Promise(resolve => setTimeout(resolve, 3000));
      await fetchWorkflowLogs(githubToken, repo.owner.login, repo.name);

      toast.success('🎉 VPS đang được tạo! Xem logs bên dưới hoặc trên GitHub Actions', { duration: 5000 });
      
      // Save GitHub token to localStorage for later deletion
      localStorage.setItem('github_token', githubToken);
      setSavedGithubToken(githubToken);
      
      // Reset form
      setGithubToken('');
      setTailscaleToken('');
      
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
              Tự động tạo Windows RDP Server qua GitHub Actions + Tailscale
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
            <CardDescription>Nhập GitHub Token và Tailscale Token để tạo VPS tự động</CardDescription>
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
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <strong>Cần quyền:</strong> <code className="bg-muted px-1 rounded">repo</code> (full), <code className="bg-muted px-1 rounded">workflow</code>
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => window.open('https://github.com/settings/tokens/new?scopes=repo,workflow&description=Lovable%20VPS%20Console', '_blank')}
                  >
                    📋 Tạo GitHub Token mới (Click here)
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tailscale-token">Tailscale Auth Key</Label>
                <Input
                  id="tailscale-token"
                  type="password"
                  placeholder="tskey-auth-xxx..."
                  value={tailscaleToken}
                  onChange={(e) => setTailscaleToken(e.target.value)}
                  disabled={isProcessing}
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <strong>Auth Key:</strong> Reusable, không hết hạn
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => window.open('https://login.tailscale.com/admin/settings/keys', '_blank')}
                  >
                    🔑 Tạo Tailscale Auth Key (Click here)
                  </Button>
                </div>
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
                    onClick={() => deleteSession(session.id, session.repo_url)}
                    title="Xóa session và GitHub repository"
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
