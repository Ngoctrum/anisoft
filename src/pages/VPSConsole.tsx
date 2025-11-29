import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Server, Play, Terminal, ExternalLink, Key, Trash2, Settings, Info, BarChart, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { RDPSessionCard } from '@/components/RDPSessionCard';
import { Header } from '@/components/Header';
import { Switch } from '@/components/ui/switch';
import { VPSAnalyticsDashboard } from '@/components/vps/VPSAnalyticsDashboard';
import windowsWorkflowTemplate from '@/assets/windows-rdp-workflow.yml?raw';
import windowsNgrokWorkflowTemplate from '@/assets/windows-rdp-ngrok-workflow.yml?raw';
import ubuntuWorkflowTemplate from '@/assets/ubuntu-ssh-workflow.yml?raw';
import ubuntuNgrokWorkflowTemplate from '@/assets/ubuntu-ssh-ngrok-workflow.yml?raw';
import debianWorkflowTemplate from '@/assets/debian-ssh-workflow.yml?raw';
import debianNgrokWorkflowTemplate from '@/assets/debian-ssh-ngrok-workflow.yml?raw';
import archlinuxWorkflowTemplate from '@/assets/archlinux-ssh-workflow.yml?raw';
import archlinuxNgrokWorkflowTemplate from '@/assets/archlinux-ssh-ngrok-workflow.yml?raw';
import centosWorkflowTemplate from '@/assets/centos-ssh-workflow.yml?raw';
import centosNgrokWorkflowTemplate from '@/assets/centos-ssh-ngrok-workflow.yml?raw';
import _sodium from 'libsodium-wrappers';

interface Session {
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

export default function VPSConsole() {
  const [githubToken, setGithubToken] = useState('');
  const [tailscaleToken, setTailscaleToken] = useState('');
  const [ngrokToken, setNgrokToken] = useState('');
  const [networkingType, setNetworkingType] = useState<'tailscale' | 'ngrok'>('tailscale');
  const [osType, setOsType] = useState<'windows' | 'ubuntu' | 'debian' | 'archlinux' | 'centos'>('windows');
  const [vpsConfig, setVpsConfig] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [durationHours, setDurationHours] = useState(6);

  // Auto-switch to Tailscale when Windows is selected (Ngrok requires credit card for RDP)
  useEffect(() => {
    if (osType === 'windows' && networkingType === 'ngrok') {
      setNetworkingType('tailscale');
      toast.warning('Windows RDP yêu cầu Tailscale (Ngrok free không hỗ trợ RDP port)');
    }
  }, [osType, networkingType]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [savedGithubToken, setSavedGithubToken] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [saveTokensEnabled, setSaveTokensEnabled] = useState(false);

  // Config info
  const CONFIG_INFO = {
    basic: {
      cpu: '2 vCPU',
      ram: '2 GB RAM',
      disk: '20 GB SSD',
      description: 'Phù hợp cho việc học tập, test nhỏ',
    },
    standard: {
      cpu: '4 vCPU',
      ram: '4 GB RAM',
      disk: '40 GB SSD',
      description: 'Phù hợp cho dev, website nhỏ',
    },
    premium: {
      cpu: '16 vCPU',
      ram: '16 GB RAM',
      disk: '160 GB SSD',
      description: 'Hiệu năng cao nhất - Production & App lớn',
    },
  };

  // Load saved tokens from localStorage (persists across sessions)
  useEffect(() => {
    const savedGithub = localStorage.getItem('vps_github_token');
    const savedTailscale = localStorage.getItem('vps_tailscale_token');
    const savedNgrok = localStorage.getItem('vps_ngrok_token');
    const savedNetworkingType = localStorage.getItem('vps_networking_type') as 'tailscale' | 'ngrok';
    const savedTokensFlag = localStorage.getItem('vps_save_tokens_enabled');
    
    // Load GitHub token for form (vps_github_token) and for deletion (github_token)
    const githubTokenForDeletion = localStorage.getItem('github_token');
    if (githubTokenForDeletion) {
      setSavedGithubToken(githubTokenForDeletion);
    }
    
    if (savedGithub) {
      setGithubToken(savedGithub);
    }
    if (savedTailscale) {
      setTailscaleToken(savedTailscale);
    }
    if (savedNgrok) {
      setNgrokToken(savedNgrok);
    }
    if (savedNetworkingType) {
      setNetworkingType(savedNetworkingType);
    }
    if (savedTokensFlag === 'true') {
      setSaveTokensEnabled(true);
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
    const isWindows = osType === 'windows';
    const osPrefix = isWindows ? 'windows-rdp' : `${osType}-ssh`;
    const repoName = `${osPrefix}-${Date.now()}`;
    const osName = osType === 'windows' ? 'Windows' : 
                   osType === 'ubuntu' ? 'Ubuntu' : 
                   osType === 'debian' ? 'Debian' : 
                   osType === 'archlinux' ? 'Arch Linux' : 'CentOS';
    const description = isWindows
      ? 'Windows RDP Server via GitHub Actions & Tailscale'
      : `${osName} SSH Server via GitHub Actions & Tailscale`;
    
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description,
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
    const isWindows = osType === 'windows';
    const isTailscale = networkingType === 'tailscale';
    
    // Tên workflow file dựa trên OS và networking type
    let workflowFileName: string;
    if (isWindows) {
      workflowFileName = isTailscale ? 'windows-rdp.yml' : 'windows-rdp-ngrok.yml';
    } else {
      workflowFileName = isTailscale ? `${osType}-ssh.yml` : `${osType}-ssh-ngrok.yml`;
    }
    
    // Chọn workflow content dựa trên OS và networking type
    let workflowContent: string;
    if (isWindows) {
      workflowContent = isTailscale ? windowsWorkflowTemplate : windowsNgrokWorkflowTemplate;
    } else if (osType === 'ubuntu') {
      workflowContent = isTailscale ? ubuntuWorkflowTemplate : ubuntuNgrokWorkflowTemplate;
    } else if (osType === 'debian') {
      workflowContent = isTailscale ? debianWorkflowTemplate : debianNgrokWorkflowTemplate;
    } else if (osType === 'archlinux') {
      workflowContent = isTailscale ? archlinuxWorkflowTemplate : archlinuxNgrokWorkflowTemplate;
    } else {
      workflowContent = isTailscale ? centosWorkflowTemplate : centosNgrokWorkflowTemplate;
    }
    
    const path = `.github/workflows/${workflowFileName}`;
    const networkingName = isTailscale ? 'Tailscale' : 'Ngrok';
    
    console.log('📄 Uploading workflow:', workflowFileName);
    console.log('🌐 Networking:', networkingName);
    console.log('📝 Workflow content length:', workflowContent?.length || 0);
    
    if (!workflowContent || workflowContent.length === 0) {
      throw new Error(`❌ Workflow template trống cho ${osType} + ${networkingName}! Vui lòng thử lại.`);
    }
    
    const encodedContent = btoa(unescape(encodeURIComponent(workflowContent)));

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Add ${osType} workflow with ${networkingName}`,
        content: encodedContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Upload workflow failed:', errorData);
      throw new Error(`❌ Lỗi upload workflow: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Workflow uploaded successfully:', result.content?.name);
    return result;
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

  const getDefaultBranch = async (token: string, owner: string, repo: string): Promise<string> => {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      console.warn('Could not get default branch, assuming main');
      return 'main';
    }
    
    const repoData = await response.json();
    return repoData.default_branch || 'main';
  };

  const verifyWorkflowExists = async (token: string, owner: string, repo: string, workflowFileName: string): Promise<boolean> => {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows/${workflowFileName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    return response.ok;
  };

  const triggerWorkflow = async (token: string, owner: string, repo: string) => {
    const isWindows = osType === 'windows';
    const isTailscale = networkingType === 'tailscale';
    
    // Tên workflow file dựa trên OS và networking type
    let workflowFileName: string;
    if (isWindows) {
      workflowFileName = isTailscale ? 'windows-rdp.yml' : 'windows-rdp-ngrok.yml';
    } else {
      workflowFileName = isTailscale ? `${osType}-ssh.yml` : `${osType}-ssh-ngrok.yml`;
    }
    
    const durationInput = isWindows
      ? (durationHours === 1 ? '1h' : durationHours === 3 ? '3h' : '5h40m')
      : `${durationHours}h`;

    // Get default branch (could be main or master)
    const defaultBranch = await getDefaultBranch(token, owner, repo);
    console.log('📌 Default branch:', defaultBranch);

    // Verify workflow file exists before triggering
    const workflowExists = await verifyWorkflowExists(token, owner, repo, workflowFileName);
    if (!workflowExists) {
      throw new Error(`Workflow file ${workflowFileName} không tồn tại trong repo. Đợi thêm vài giây và thử lại.`);
    }

    console.log('🚀 Triggering workflow', {
      owner,
      repo,
      workflowFileName,
      branch: defaultBranch,
      durationInput,
      vpsConfig,
    });

    // Try triggering with retry logic (max 3 attempts)
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
              ref: defaultBranch,
              inputs: {
                duration: durationInput,
                config: vpsConfig,
              },
            }),
          }
        );

        if (response.ok || response.status === 204) {
          console.log('✅ Workflow triggered successfully');
          return; // Success!
        }

        const errorText = await response.text().catch(() => '');
        console.error(`❌ Attempt ${attempt} failed:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        if (response.status === 404) {
          throw new Error(`Không tìm thấy workflow file "${workflowFileName}" trên nhánh "${defaultBranch}". Hãy kiểm tra lại repo.`);
        } else if (response.status === 403) {
          throw new Error('GitHub Token thiếu quyền "workflow". Hãy tạo lại Classic token với scopes: ✅ repo + ✅ workflow');
        } else if (response.status === 422) {
          // Workflow might not be ready yet, retry
          if (attempt < 3) {
            console.log(`⏳ Workflow chưa sẵn sàng, đợi ${attempt * 2} giây...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
            continue;
          }
        }

        lastError = new Error(`Lỗi ${response.status}: ${response.statusText || errorText}`);
      } catch (error: any) {
        lastError = error;
        if (attempt < 3) {
          console.log(`⏳ Retry attempt ${attempt + 1}/3...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError || new Error('Failed to trigger workflow after 3 attempts');
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

  const handleSaveTokens = () => {
    // Validate GitHub token format
    const githubTokenPattern = /^gh[ps]_[a-zA-Z0-9]{36,}$/;
    if (githubToken.trim() && !githubTokenPattern.test(githubToken.trim())) {
      toast.error('GitHub Token không đúng định dạng (phải bắt đầu bằng ghp_ hoặc ghs_)');
      return;
    }

    // Validate networking tokens based on type
    if (networkingType === 'tailscale') {
      if (tailscaleToken.trim() && !tailscaleToken.trim().startsWith('tskey-auth-')) {
        toast.error('Tailscale Token không đúng định dạng (phải bắt đầu bằng tskey-auth-)');
        return;
      }
    } else {
      if (ngrokToken.trim() && ngrokToken.trim().length < 10) {
        toast.error('Ngrok Token không hợp lệ');
        return;
      }
    }

    // Save tokens to localStorage (persists across sessions)
    if (githubToken.trim()) {
      localStorage.setItem('vps_github_token', githubToken);
      localStorage.setItem('github_token', githubToken); // Also save for deletion purposes
      setSavedGithubToken(githubToken);
    }
    localStorage.setItem('vps_networking_type', networkingType);
    if (networkingType === 'tailscale' && tailscaleToken.trim()) {
      localStorage.setItem('vps_tailscale_token', tailscaleToken);
    } else if (networkingType === 'ngrok' && ngrokToken.trim()) {
      localStorage.setItem('vps_ngrok_token', ngrokToken);
    }
    
    toast.success('✅ Settings đã được lưu! Tokens sẽ không bị mất khi chuyển trang.');
    setShowSettings(false);
  };

  const handleCreateVPS = async () => {
    // Validate GitHub token format
    const githubTokenPattern = /^gh[ps]_[a-zA-Z0-9]{36,}$/;
    if (!githubToken.trim()) {
      toast.error('Vui lòng nhập GitHub Token');
      return;
    }
    if (!githubTokenPattern.test(githubToken.trim())) {
      toast.error('GitHub Token không đúng định dạng (phải bắt đầu bằng ghp_ hoặc ghs_)');
      return;
    }

    // Validate networking token based on type
    if (networkingType === 'tailscale') {
      if (!tailscaleToken.trim()) {
        toast.error('Vui lòng nhập Tailscale Auth Token');
        return;
      }
      if (!tailscaleToken.trim().startsWith('tskey-auth-')) {
        toast.error('Tailscale Token không đúng định dạng (phải bắt đầu bằng tskey-auth-)');
        return;
      }
    } else {
      // Ngrok type
      if (!ngrokToken.trim()) {
        toast.error('Vui lòng nhập Ngrok Authtoken');
        return;
      }
      if (ngrokToken.trim().length < 10) {
        toast.error('Ngrok Authtoken không hợp lệ');
        return;
      }
    }

    setIsProcessing(true);
    const osDisplayName = osType === 'windows' ? 'Windows RDP' : 
                         osType === 'ubuntu' ? 'Ubuntu SSH' : 
                         osType === 'debian' ? 'Debian SSH' : 
                         osType === 'archlinux' ? 'Arch Linux SSH' : 'CentOS SSH';
    const networkingName = networkingType === 'tailscale' ? 'Tailscale' : 'Ngrok';
    setLogs([`🚀 Bắt đầu tạo ${osDisplayName} Server (${networkingName})...`]);

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
      expiresAt.setHours(expiresAt.getHours() + durationHours);

      const { data: session, error: sessionError } = await supabase
        .from('rdp_sessions')
        .insert({
          user_id: userData.user.id,
          github_repo: repo.name,
          repo_url: repo.html_url,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          os_type: osType,
          vps_config: vpsConfig,
          duration_hours: durationHours,
          is_active: true,
          networking_type: networkingType,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setLogs((prev) => [...prev, '✅ Session đã được tạo']);

      // Step 3: Upload workflow
      setLogs((prev) => [...prev, `📄 Đang upload workflow file cho ${osType}...`]);
      try {
        await uploadWorkflowFile(githubToken, repo.owner.login, repo.name);
        setLogs((prev) => [...prev, '✅ Workflow file đã được upload thành công!']);
      } catch (uploadError: any) {
        setLogs((prev) => [...prev, `❌ Lỗi upload workflow: ${uploadError.message}`]);
        throw uploadError;
      }

      // Step 4: Wait for workflow file to be committed
      setLogs((prev) => [...prev, '⏳ Đợi 8 giây để workflow được xử lý...']);
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Step 5: Add networking secret based on type
      const secretName = networkingType === 'tailscale' ? 'TAILSCALE_AUTH_KEY' : 'NGROK_AUTH_TOKEN';
      const secretValue = networkingType === 'tailscale' ? tailscaleToken : ngrokToken;
      setLogs((prev) => [...prev, `🔐 Đang thêm ${networkingName} token vào repository...`]);
      try {
        await addGithubSecret(githubToken, repo.owner.login, repo.name, secretName, secretValue);
        setLogs((prev) => [...prev, `✅ ${networkingName} secret đã được thêm tự động!`]);
      } catch (error: any) {
        setLogs((prev) => [...prev, '⚠️ Không thể thêm secret tự động, thử phương án khác...']);
        // Fallback: Continue anyway, user might add manually
      }

      // Step 6: Trigger workflow automatically
      setLogs((prev) => [...prev, '🚀 Đang trigger workflow tự động...']);
      try {
        await triggerWorkflow(githubToken, repo.owner.login, repo.name);
        setLogs((prev) => [...prev, '✅ Workflow đã được trigger thành công!']);
      } catch (triggerError: any) {
        setLogs((prev) => [...prev, `❌ Lỗi trigger: ${triggerError.message}`]);
        throw triggerError;
      }

      // Step 7: Start monitoring workflow logs
      setLogs((prev) => [...prev, '👀 Đang theo dõi workflow...']);
      await new Promise(resolve => setTimeout(resolve, 3000));
      await fetchWorkflowLogs(githubToken, repo.owner.login, repo.name);

      toast.success(`🎉 VPS (${networkingName}) đang được tạo! Xem logs bên dưới hoặc trên GitHub Actions`, { duration: 5000 });
      
      // Save GitHub token to localStorage for later deletion
      localStorage.setItem('github_token', githubToken);
      setSavedGithubToken(githubToken);
      
      // Save tokens preference
      localStorage.setItem('vps_save_tokens_enabled', saveTokensEnabled.toString());
      
      if (!saveTokensEnabled) {
        // Clear tokens after successful VPS creation if user doesn't want to save
        localStorage.removeItem('vps_github_token');
        localStorage.removeItem('vps_tailscale_token');
        localStorage.removeItem('vps_ngrok_token');
        localStorage.removeItem('vps_networking_type');
        toast.info('Tokens đã được xóa sau khi tạo VPS');
      }
      
      // Note: NOT resetting form tokens so user can create another VPS quickly
      
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
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Tabs defaultValue="console" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="console" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              VPS Console
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="console" className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
              <Server className="h-10 w-10 text-primary" />
              VPS Console
            </h1>
            <p className="text-muted-foreground mt-2">
              Tự động tạo Windows/Ubuntu VPS qua GitHub Actions + Tailscale
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowSettings(!showSettings)} title="Settings">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="border-2 shadow-lg bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Cài đặt Networking & Tokens
              </CardTitle>
              <CardDescription>
                💾 Tokens được lưu vĩnh viễn (localStorage) - không mất khi đóng trình duyệt. 
                Dùng checkbox bên dưới để kiểm soát xóa tokens sau khi tạo VPS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Networking Type Selection */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Loại kết nối mạng</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Chọn phương thức kết nối từ xa cho VPS
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="settings_networking_tailscale"
                      name="settings_networking_type"
                      value="tailscale"
                      checked={networkingType === 'tailscale'}
                      onChange={(e) => setNetworkingType(e.target.value as 'tailscale' | 'ngrok')}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="settings_networking_tailscale" className="font-normal cursor-pointer">
                      🔒 Tailscale (Mạng riêng)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="settings_networking_ngrok"
                      name="settings_networking_type"
                      value="ngrok"
                      checked={networkingType === 'ngrok'}
                      onChange={(e) => setNetworkingType(e.target.value as 'tailscale' | 'ngrok')}
                      disabled={osType === 'windows'}
                      className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Label htmlFor="settings_networking_ngrok" className={`font-normal cursor-pointer ${osType === 'windows' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      🌐 Ngrok (Internet công khai) {osType === 'windows' && '❌ Không hỗ trợ Windows'}
                    </Label>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                  <p className="text-xs text-muted-foreground">
                    {networkingType === 'tailscale' ? (
                      <>✅ <strong>Tailscale:</strong> Mạng riêng bảo mật, cần cài Tailscale trên máy</>
                    ) : (
                      <>✅ <strong>Ngrok:</strong> Truy cập từ bất kỳ đâu, không cần cài phần mềm. ⚠️ <strong>Chỉ hỗ trợ Linux</strong> (Ngrok free không cho phép Windows RDP)</>
                    )}
                  </p>
                </div>
              </div>

              {/* Tokens Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Networking Tokens</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="saved-github-token">GitHub Personal Access Token</Label>
                    <Input
                      id="saved-github-token"
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxx"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                    />
                  </div>
                  
                  {networkingType === 'tailscale' ? (
                    <div className="space-y-2">
                      <Label htmlFor="saved-tailscale-token">Tailscale Auth Key</Label>
                      <Input
                        id="saved-tailscale-token"
                        type="password"
                        placeholder="tskey-auth-xxx..."
                        value={tailscaleToken}
                        onChange={(e) => setTailscaleToken(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        <a href="https://login.tailscale.com/admin/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          🔑 Lấy Tailscale Auth Key
                        </a>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="saved-ngrok-token">Ngrok Authtoken</Label>
                      <Input
                        id="saved-ngrok-token"
                        type="password"
                        placeholder="2c..."
                        value={ngrokToken}
                        onChange={(e) => setNgrokToken(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        <a href="https://dashboard.ngrok.com/get-started/your-authtoken" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          🔑 Lấy Ngrok Authtoken
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowSettings(false)}>Hủy</Button>
                <Button onClick={handleSaveTokens}>
                  💾 Lưu Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create VPS Form */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Tạo VPS Mới
            </CardTitle>
            <CardDescription>
              Chọn phương thức kết nối và nhập tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Networking Type Display */}
            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <span>Đang dùng: <strong>{networkingType === 'tailscale' ? '🔒 Tailscale' : '🌐 Ngrok'}</strong></span>
                <span className="text-xs ml-2 text-muted-foreground">(Thay đổi trong Settings)</span>
              </AlertDescription>
            </Alert>

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

            </div>

            {/* VPS Configuration */}
            <div className="grid gap-4 md:grid-cols-3 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="os-type">Hệ điều hành</Label>
                <Select value={osType} onValueChange={(value: 'windows' | 'ubuntu' | 'debian' | 'archlinux' | 'centos') => setOsType(value)}>
                  <SelectTrigger id="os-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="windows">🪟 Windows Server 2025</SelectItem>
                    <SelectItem value="ubuntu">🐧 Ubuntu 22.04 LTS</SelectItem>
                    <SelectItem value="debian">🌀 Debian 12</SelectItem>
                    <SelectItem value="archlinux">⚡ Arch Linux</SelectItem>
                    <SelectItem value="centos">🔷 CentOS Stream 9</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="vps-config">Cấu hình VPS</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-primary/10">
                        <Info className="h-4 w-4 text-primary" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20" align="start">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <span className="text-2xl">
                            {vpsConfig === 'basic' ? '⚡' : vpsConfig === 'standard' ? '💎' : '👑'}
                          </span>
                          {vpsConfig === 'basic' ? 'Basic' : vpsConfig === 'standard' ? 'Standard' : 'Premium'}
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                            <span className="text-sm text-muted-foreground">CPU</span>
                            <span className="font-bold text-primary">{CONFIG_INFO[vpsConfig].cpu}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                            <span className="text-sm text-muted-foreground">RAM</span>
                            <span className="font-bold text-primary">{CONFIG_INFO[vpsConfig].ram}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                            <span className="text-sm text-muted-foreground">Disk</span>
                            <span className="font-bold text-primary">{CONFIG_INFO[vpsConfig].disk}</span>
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                          <p className="text-sm italic text-muted-foreground">{CONFIG_INFO[vpsConfig].description}</p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Select value={vpsConfig} onValueChange={(value: 'basic' | 'standard' | 'premium') => setVpsConfig(value)}>
                  <SelectTrigger id="vps-config">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      <div className="flex items-center gap-2">
                        <span>⚡ Basic</span>
                        <span className="text-xs text-muted-foreground">{CONFIG_INFO.basic.cpu}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="standard">
                      <div className="flex items-center gap-2">
                        <span>💎 Standard</span>
                        <span className="text-xs text-muted-foreground">{CONFIG_INFO.standard.cpu}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="premium">
                      <div className="flex items-center gap-2">
                        <span>👑 Premium</span>
                        <span className="text-xs text-muted-foreground">{CONFIG_INFO.premium.cpu}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Thời gian (giờ)</Label>
                <Select value={durationHours.toString()} onValueChange={(value) => setDurationHours(parseInt(value))}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 giờ</SelectItem>
                    <SelectItem value="2">2 giờ</SelectItem>
                    <SelectItem value="3">3 giờ</SelectItem>
                    <SelectItem value="4">4 giờ</SelectItem>
                    <SelectItem value="5">5 giờ</SelectItem>
                    <SelectItem value="6">6 giờ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Alert className="bg-blue-500/10 border-blue-500/20">
              <AlertDescription className="text-sm">
                💡 <strong>Thông tin:</strong> {osType === 'windows' ? 'Windows RDP' : 
                  osType === 'ubuntu' ? 'Ubuntu SSH' : 
                  osType === 'debian' ? 'Debian SSH' : 
                  osType === 'archlinux' ? 'Arch Linux SSH' : 'CentOS SSH'} • {vpsConfig.toUpperCase()} • Tự động xóa sau {durationHours}h
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="save-tokens"
                  checked={saveTokensEnabled}
                  onCheckedChange={setSaveTokensEnabled}
                />
                <Label htmlFor="save-tokens" className="cursor-pointer">
                  💾 Lưu tokens sau khi tạo VPS
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-7">
                {saveTokensEnabled ? 
                  '✅ Tokens sẽ được giữ lại sau khi tạo VPS - không cần nhập lại lần sau' : 
                  '⚠️ Tokens sẽ tự động xóa sau khi tạo VPS - cần nhập lại lần sau'}
              </p>
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
                  Tạo {osType === 'windows' ? 'Windows RDP' : 
                    osType === 'ubuntu' ? 'Ubuntu SSH' : 
                    osType === 'debian' ? 'Debian SSH' : 
                    osType === 'archlinux' ? 'Arch Linux SSH' : 'CentOS SSH'} Server
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
          </TabsContent>

          <TabsContent value="analytics" className="animate-fade-in">
            <VPSAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </>
  );
}
