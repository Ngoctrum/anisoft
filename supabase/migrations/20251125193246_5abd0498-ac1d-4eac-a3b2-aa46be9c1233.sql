
-- Add delete policy for users to delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON public.rdp_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable pg_cron and pg_net extensions for auto cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
