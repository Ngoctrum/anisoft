
-- vps_templates
CREATE TABLE public.vps_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  os_type TEXT NOT NULL,
  networking_type TEXT NOT NULL,
  vps_config TEXT NOT NULL DEFAULT 'standard',
  duration_hours INTEGER NOT NULL DEFAULT 6,
  icon TEXT DEFAULT '🖥️',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vps_templates TO authenticated;
GRANT ALL ON public.vps_templates TO service_role;

ALTER TABLE public.vps_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own templates" ON public.vps_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_vps_templates_updated
  BEFORE UPDATE ON public.vps_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- notification_channels
CREATE TABLE public.notification_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('telegram', 'discord', 'webhook', 'email')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  events TEXT[] NOT NULL DEFAULT ARRAY['ready','expiring','error','killed']::TEXT[],
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_channels TO authenticated;
GRANT ALL ON public.notification_channels TO service_role;

ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own channels" ON public.notification_channels
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_notification_channels_updated
  BEFORE UPDATE ON public.notification_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
