-- Fix overly permissive RLS policy on rdp_sessions
DROP POLICY IF EXISTS "Service can update sessions" ON rdp_sessions;

-- Create a more restrictive policy for users to update only their own sessions
CREATE POLICY "Users can update own sessions" ON rdp_sessions
FOR UPDATE 
USING (auth.uid() = user_id);

-- Service role (used by edge functions) bypasses RLS, so backend callbacks will still work