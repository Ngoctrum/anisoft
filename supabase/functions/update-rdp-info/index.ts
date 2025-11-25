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

    const { repoName, ngrokUrl, rdpUser, rdpPassword } = await req.json();

    console.log('Received update request:', { repoName, ngrokUrl, rdpUser });

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

    // Update the session with RDP info
    const updateData: any = {
      rdp_user: rdpUser,
      rdp_password: rdpPassword,
      status: 'connected',
      updated_at: new Date().toISOString(),
    };

    // Save Ngrok URL to tailscale_ip column (as per report)
    if (ngrokUrl) {
      updateData.tailscale_ip = ngrokUrl;
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
