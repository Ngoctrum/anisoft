
-- Create rdp_sessions table
CREATE TABLE IF NOT EXISTS public.rdp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  github_repo TEXT NOT NULL,
  repo_url TEXT,
  tailscale_ip TEXT, -- Will store Ngrok URL
  rdp_user TEXT,
  rdp_password TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.rdp_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.rdp_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can create sessions"
  ON public.rdp_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow updates from edge function (service role)
CREATE POLICY "Service can update sessions"
  ON public.rdp_sessions
  FOR UPDATE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_rdp_sessions_updated_at
  BEFORE UPDATE ON public.rdp_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rdp_sessions;
