import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key for cron job access
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('CLEANUP_API_KEY');
    
    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();
    
    // Delete sessions that:
    // 1. Have status 'failed'
    // 2. Have expired (expires_at < now)
    // 3. Are pending for more than 30 minutes (likely stuck)
    
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    // First, get sessions to delete (to access github_repo info)
    const { data: sessionsToDelete, error: fetchError } = await supabase
      .from('rdp_sessions')
      .select('*')
      .or(`status.eq.failed,expires_at.lt.${now},and(status.eq.pending,created_at.lt.${thirtyMinutesAgo})`);

    if (fetchError) {
      console.error('Error fetching sessions to delete:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sessions', details: fetchError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Notify users about expired/failed sessions
    const notifyUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-vps-notification`;
    const notifyHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` };
    if (sessionsToDelete) {
      for (const s of sessionsToDelete) {
        if (!s.user_id) continue;
        const event = s.status === 'failed' ? 'error' : 'killed';
        fetch(notifyUrl, { method: 'POST', headers: notifyHeaders, body: JSON.stringify({ userId: s.user_id, sessionId: s.id, event }) }).catch(() => {});
      }
    }

    // Notify sessions expiring within 10 minutes (still active)
    const in10Min = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { data: expiring } = await supabase
      .from('rdp_sessions')
      .select('id, user_id, expires_at')
      .eq('is_active', true)
      .gte('expires_at', now)
      .lte('expires_at', in10Min);
    if (expiring) {
      for (const s of expiring) {
        if (!s.user_id) continue;
        fetch(notifyUrl, { method: 'POST', headers: notifyHeaders, body: JSON.stringify({ userId: s.user_id, sessionId: s.id, event: 'expiring' }) }).catch(() => {});
      }
    }

    // Delete GitHub repositories for each session
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    if (githubToken && sessionsToDelete) {
      for (const session of sessionsToDelete) {
        if (session.github_repo) {
          try {
            const [owner, repo] = session.github_repo.split('/');
            const deleteRepoResponse = await fetch(
              `https://api.github.com/repos/${owner}/${repo}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${githubToken}`,
                  'Accept': 'application/vnd.github.v3+json',
                }
              }
            );
            
            if (deleteRepoResponse.ok) {
              console.log(`Deleted GitHub repo: ${session.github_repo}`);
            } else {
              console.error(`Failed to delete repo ${session.github_repo}:`, await deleteRepoResponse.text());
            }
          } catch (error) {
            console.error(`Error deleting GitHub repo ${session.github_repo}:`, error);
          }
        }
      }
    }

    // Now delete the sessions from database
    const { data: deletedSessions, error: deleteError } = await supabase
      .from('rdp_sessions')
      .delete()
      .or(`status.eq.failed,expires_at.lt.${now},and(status.eq.pending,created_at.lt.${thirtyMinutesAgo})`)
      .select();

    if (deleteError) {
      console.error('Error deleting sessions:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete sessions', details: deleteError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const deletedCount = deletedSessions?.length || 0;
    console.log(`Cleaned up ${deletedCount} sessions with GitHub repos`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted_count: deletedCount,
        deleted_sessions: deletedSessions 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in cleanup-failed-sessions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
