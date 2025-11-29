-- Add session_logs table for detailed logging and monitoring
CREATE TABLE IF NOT EXISTS public.session_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rdp_sessions(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL, -- 'info', 'warning', 'error', 'success'
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add analytics fields to rdp_sessions
ALTER TABLE public.rdp_sessions 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stopped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_uptime_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS connection_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_monitored_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on session_logs
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for session_logs - users can view their own session logs
CREATE POLICY "Users can view own session logs"
ON public.session_logs
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.rdp_sessions WHERE user_id = auth.uid()
  )
);

-- RLS policy for session_logs - automatic insertion allowed
CREATE POLICY "Anyone can insert session logs"
ON public.session_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster log queries
CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON public.session_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON public.session_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rdp_sessions_user_id_created_at ON public.rdp_sessions(user_id, created_at DESC);

-- Enable realtime for session_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_logs;