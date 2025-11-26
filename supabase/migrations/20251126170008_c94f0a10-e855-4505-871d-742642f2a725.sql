-- Add networking_type column to rdp_sessions table to support both Tailscale and Ngrok
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rdp_sessions' 
    AND column_name = 'networking_type'
  ) THEN
    ALTER TABLE public.rdp_sessions 
    ADD COLUMN networking_type TEXT DEFAULT 'tailscale' CHECK (networking_type IN ('tailscale', 'ngrok'));
  END IF;
END $$;

-- Add ngrok_url column to store Ngrok public URL (different from tailscale_ip)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rdp_sessions' 
    AND column_name = 'ngrok_url'
  ) THEN
    ALTER TABLE public.rdp_sessions 
    ADD COLUMN ngrok_url TEXT;
  END IF;
END $$;

-- Update site_settings to include Ngrok auth token
INSERT INTO public.site_settings (key, value)
VALUES (
  'vps_settings',
  jsonb_build_object(
    'ngrok_auth_token', '',
    'default_networking_type', 'tailscale'
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;