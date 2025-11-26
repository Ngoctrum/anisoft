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
      .single();

    if (sessionError || !session) {
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

    if (action === 'kill') {
      // Kill VPS by canceling GitHub Actions workflow
      if (workflowRunId && githubToken) {
        const [owner, repo] = session.github_repo.split('/');
        
        try {
          const cancelResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/actions/runs/${workflowRunId}/cancel`,
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
      // Start VPS by triggering GitHub Actions workflow again
      if (!githubToken) {
        return new Response(
          JSON.stringify({ error: 'GitHub token required to start VPS' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update session to pending
      await supabase
        .from('rdp_sessions')
        .update({
          is_active: true,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      return new Response(
        JSON.stringify({ success: true, message: 'VPS restart initiated' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
