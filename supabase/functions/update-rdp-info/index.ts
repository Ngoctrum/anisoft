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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { repoName, ngrokUrl, rdpUser, rdpPassword, osType, sshPort, networkingType } = await req.json();

    console.log('Received update request:', { repoName, ngrokUrl, rdpUser, osType, networkingType });

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
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update the session with connection info
    const updateData: any = {
      rdp_user: rdpUser,
      rdp_password: rdpPassword,
      status: 'connected',
      is_active: true,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save connection URL based on networking type
    if (ngrokUrl) {
      // For Tailscale, save as tailscale_ip
      // For Ngrok/Cloudflare/noVNC, save as ngrok_url
      const currentNetType = networkingType || session.networking_type || 'tailscale';
      if (currentNetType === 'tailscale') {
        updateData.tailscale_ip = ngrokUrl;
      } else {
        updateData.ngrok_url = ngrokUrl;
        // Also save to tailscale_ip for backward compatibility
        updateData.tailscale_ip = ngrokUrl;
      }
    }

    // Save networking type if provided
    if (networkingType) {
      updateData.networking_type = networkingType;
    }

    // Save OS type and SSH port if provided
    if (osType) {
      updateData.os_type = osType;
    }
    if (sshPort) {
      updateData.ssh_port = sshPort;
    }

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
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Session updated successfully:', updatedSession);

    return new Response(
      JSON.stringify({ success: true, session: updatedSession }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in update-rdp-info:', error);
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
