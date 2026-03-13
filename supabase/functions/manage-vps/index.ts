import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManageVPSRequest {
  sessionId: string;
  action: 'kill' | 'start';
  githubToken?: string;
  workflowRunId?: string;
}

interface RepoInfo {
  owner: string;
  repo: string;
}

const resolveRepoInfo = (session: any): RepoInfo | null => {
  if (session?.repo_url) {
    const match = String(session.repo_url).match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      };
    }
  }

  if (session?.github_repo && String(session.github_repo).includes('/')) {
    const [owner, repo] = String(session.github_repo).split('/');
    if (owner && repo) {
      return { owner, repo };
    }
  }

  return null;
};

const getWorkflowFileName = (osType?: string, networkingType?: string) => {
  const os = (osType || 'windows').toLowerCase();
  const networking = (networkingType || 'tailscale').toLowerCase();

  if (os === 'windows') {
    if (networking === 'ngrok') return 'windows-rdp-ngrok.yml';
    if (networking === 'cloudflare') return 'windows-rdp-cloudflare.yml';
    if (networking === 'novnc') return 'windows-rdp-novnc.yml';
    return 'windows-rdp.yml';
  }

  const linuxOs = ['ubuntu', 'debian', 'archlinux', 'centos'].includes(os) ? os : 'ubuntu';
  if (networking === 'ngrok') return `${linuxOs}-ssh-ngrok.yml`;
  if (networking === 'cloudflare') return `${linuxOs}-ssh-cloudflare.yml`;
  if (networking === 'novnc') return `${linuxOs}-ssh-novnc.yml`;
  return `${linuxOs}-ssh.yml`;
};

const getDurationInput = (durationHours?: number, osType?: string) => {
  const os = (osType || 'windows').toLowerCase();
  const hours = Number(durationHours || 6);

  if (os === 'windows') {
    if (hours === 1) return '1h';
    if (hours === 3) return '3h';
    return '5h40m';
  }

  return `${Math.max(1, Math.min(hours, 24))}h`;
};

const triggerWorkflow = async (session: any, githubToken: string, repoInfo: RepoInfo) => {
  const githubHeaders = {
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const workflowFileName = getWorkflowFileName(session.os_type, session.networking_type);
  const duration = getDurationInput(session.duration_hours, session.os_type);
  const config = session.vps_config || 'basic';

  const repoResponse = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`, {
    headers: githubHeaders,
  });

  if (!repoResponse.ok) {
    const body = await repoResponse.text();
    throw new Error(`Cannot read repository metadata: ${repoResponse.status} ${body}`);
  }

  const repoData = await repoResponse.json();
  const defaultBranch = repoData.default_branch || 'main';

  const dispatchResponse = await fetch(
    `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/actions/workflows/${workflowFileName}/dispatches`,
    {
      method: 'POST',
      headers: githubHeaders,
      body: JSON.stringify({
        ref: defaultBranch,
        inputs: {
          duration,
          config,
        },
      }),
    }
  );

  if (!dispatchResponse.ok) {
    const body = await dispatchResponse.text();
    throw new Error(`Failed to trigger workflow: ${dispatchResponse.status} ${body}`);
  }

  // Best-effort: fetch latest workflow run id for monitoring
  const runsResponse = await fetch(
    `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/actions/runs?per_page=1&event=workflow_dispatch`,
    { headers: githubHeaders }
  );

  if (!runsResponse.ok) return null;

  const runsData = await runsResponse.json();
  const latestRun = runsData?.workflow_runs?.[0];
  return latestRun?.id ? String(latestRun.id) : null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify JWT and get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { sessionId, action, githubToken, workflowRunId } = await req.json() as ManageVPSRequest;

    console.log('Manage VPS request:', { sessionId, action, userId: user.id });

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('rdp_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Error fetching session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!session) {
      // Session already deleted - treat as success for kill action
      if (action === 'kill') {
        return new Response(
          JSON.stringify({ success: true, message: 'Session already removed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify session ownership
    if (session.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not own this session' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const repoInfo = resolveRepoInfo(session);

    if (action === 'kill') {
      // Kill VPS by canceling GitHub Actions workflow (best-effort)
      const runIdToCancel = workflowRunId || session.workflow_run_id;
      if (runIdToCancel && githubToken && repoInfo) {
        try {
          const cancelResponse = await fetch(
            `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/actions/runs/${runIdToCancel}/cancel`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
              }
            }
          );

          if (!cancelResponse.ok) {
            console.error('Failed to cancel workflow:', await cancelResponse.text());
          }
        } catch (error) {
          console.error('Error canceling workflow:', error);
        }
      }

      // Update session status
      const { data: updatedSession, error: updateError } = await supabase
        .from('rdp_sessions')
        .update({
          is_active: false,
          status: 'killed',
          stopped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true, session: updatedSession }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'start') {
      // Mark session as pending first
      const { error: pendingError } = await supabase
        .from('rdp_sessions')
        .update({
          is_active: true,
          status: 'pending',
          started_at: new Date().toISOString(),
          stopped_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (pendingError) {
        throw pendingError;
      }

      // If no token, avoid hard-failing: session is still marked pending
      if (!githubToken) {
        return new Response(
          JSON.stringify({
            success: true,
            warning: 'Missing GitHub token. Session marked pending only.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!repoInfo) {
        return new Response(
          JSON.stringify({
            success: true,
            warning: 'Repository info missing. Session marked pending only.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const workflowRunIdFromGithub = await triggerWorkflow(session, githubToken, repoInfo);

        if (workflowRunIdFromGithub) {
          await supabase
            .from('rdp_sessions')
            .update({
              workflow_run_id: workflowRunIdFromGithub,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'VPS restart initiated',
            workflowRunId: workflowRunIdFromGithub,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (workflowError) {
        console.error('Error triggering workflow restart:', workflowError);

        await supabase
          .from('rdp_sessions')
          .update({
            is_active: false,
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        return new Response(
          JSON.stringify({
            error: workflowError instanceof Error ? workflowError.message : 'Failed to restart VPS',
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-vps:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
