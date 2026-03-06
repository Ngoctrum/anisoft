import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const body = await req.json();
    const { repoName, ngrokUrl, rdpUser, rdpPassword, osType, sshPort, networkingType, status } = body;

    console.log('Received update request:', { repoName, ngrokUrl, rdpUser, osType, networkingType, status });

    // Find the session by github_repo
    const { data: session, error: findError } = await supabase
      .from('rdp_sessions')
      .select('*')
      .eq('github_repo', repoName)
      .single();

    if (findError) {
      console.error('Error finding session:', findError);
      return new Response(
        JSON.stringify({ error: 'Session not found', details: findError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle FAILURE callback - mark session as failed and delete it
    if (status === 'failed') {
      console.log('Workflow failed, marking session as failed and deleting:', session.id);
      
      // Delete the failed session
      const { error: deleteError } = await supabase
        .from('rdp_sessions')
        .delete()
        .eq('id', session.id);

      if (deleteError) {
        console.error('Error deleting failed session:', deleteError);
        // Fallback: just mark as failed
        await supabase
          .from('rdp_sessions')
          .update({ status: 'failed', is_active: false, updated_at: new Date().toISOString() })
          .eq('id', session.id);
      }

      return new Response(
        JSON.stringify({ success: true, action: 'deleted_failed_session', sessionId: session.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle SUCCESS callback - update with connection info
    const updateData: Record<string, unknown> = {
      rdp_user: rdpUser,
      rdp_password: rdpPassword,
      status: 'connected',
      is_active: true,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save connection URL based on networking type
    if (ngrokUrl) {
      const currentNetType = networkingType || session.networking_type || 'tailscale';
      if (currentNetType === 'tailscale') {
        updateData.tailscale_ip = ngrokUrl;
      } else {
        updateData.ngrok_url = ngrokUrl;
        updateData.tailscale_ip = ngrokUrl; // backward compatibility
      }
    }

    if (networkingType) updateData.networking_type = networkingType;
    if (osType) updateData.os_type = osType;
    if (sshPort) updateData.ssh_port = sshPort;

    const { data: updatedSession, error: updateError } = await supabase
      .from('rdp_sessions')
      .update(updateData)
      .eq('id', session.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update session', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Session updated successfully:', updatedSession?.id);

    return new Response(
      JSON.stringify({ success: true, session: updatedSession }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-rdp-info:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
