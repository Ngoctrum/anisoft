-- ============================================
-- ANI STUDIO DATABASE SCHEMA
-- Complete database schema for Ani Studio
-- ============================================

-- ============================================
-- 1. CREATE ENUMS
-- ============================================

-- Create app_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'app_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');
  END IF;
END$$;

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_blocked BOOLEAN DEFAULT false
);

COMMENT ON TABLE public.profiles IS 'User profile information';

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

COMMENT ON TABLE public.user_roles IS 'User role assignments for access control';

-- Tools table
CREATE TABLE IF NOT EXISTS public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT,
  description TEXT,
  thumbnail_url TEXT,
  download_url TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  total_downloads INTEGER DEFAULT 0,
  status_badge TEXT,
  author_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.tools IS 'Tools, code snippets, and website templates';
COMMENT ON COLUMN public.tools.status_badge IS 'Display badge like "new", "updated", "hot", etc.';

-- Download history table
CREATE TABLE IF NOT EXISTS public.download_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

COMMENT ON TABLE public.download_history IS 'Track download history for analytics';

-- Error reports table
CREATE TABLE IF NOT EXISTS public.error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  support_type TEXT DEFAULT 'tool_error',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.error_reports IS 'User-submitted error reports and support tickets';
COMMENT ON COLUMN public.error_reports.support_type IS 'Type of support request: tool_error, website_error, website_report, general, support_request';

-- Site settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS 'System-wide configuration settings';

-- ============================================
-- 3. INSERT DEFAULT DATA
-- ============================================

INSERT INTO public.site_settings (key, value) 
SELECT * FROM (VALUES
  ('general', '{
    "site_name": "Ani Studio",
    "site_logo_url": "",
    "site_favicon_url": "",
    "site_slogan": "Your Hub for Tools & Code",
    "site_description_seo": "Download and share tools, code, and website templates",
    "is_registration_enabled": true,
    "is_site_maintenance": false,
    "default_language": "vi",
    "timezone": "Asia/Ho_Chi_Minh"
  }'::jsonb),
  ('download', '{
    "download_countdown_seconds": 5,
    "download_warning_text": "Các code / tools trên website Ani Studio đều do Team Ani Studio hoặc cộng đồng chia sẻ. Chỉ mang tính tham khảo. Chúng tôi không chịu trách nhiệm với bất kỳ rủi ro nào khi bạn sử dụng. Nếu có lỗi, hãy gửi báo cáo lỗi qua menu.",
    "enable_download_history": true,
    "limit_downloads_per_user_per_day": null,
    "enable_auto_redirect": true
  }'::jsonb),
  ('contact', '{
    "contact_email": "contact@anistudio.com",
    "facebook_url": "",
    "zalo_url": "",
    "youtube_url": "",
    "telegram_url": "",
    "support_group_url": ""
  }'::jsonb),
  ('theme', '{
    "primary_color": "200 100% 50%",
    "background_color": "222 47% 11%",
    "dark_mode_enabled": true
  }'::jsonb),
  ('smtp', '{
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_user": "",
    "smtp_password": "",
    "smtp_from_email": "",
    "smtp_from_name": "Ani Studio"
  }'::jsonb)
) AS v(key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_settings WHERE site_settings.key = v.key
);

-- ============================================
-- 4. CREATE FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

COMMENT ON FUNCTION public.has_role IS 'Check if user has specific role - used in RLS policies';

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically create profile and assign user role on signup';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column IS 'Automatically update updated_at column on row update';

-- ============================================
-- 5. CREATE TRIGGERS
-- ============================================

-- Trigger for new user signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;

-- Triggers for updated_at columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_tools_updated_at'
  ) THEN
    CREATE TRIGGER update_tools_updated_at
      BEFORE UPDATE ON public.tools
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_error_reports_updated_at'
  ) THEN
    CREATE TRIGGER update_error_reports_updated_at
      BEFORE UPDATE ON public.error_reports
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_site_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_site_settings_updated_at
      BEFORE UPDATE ON public.site_settings
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE RLS POLICIES
-- ============================================

-- Profiles policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone' AND tablename = 'profiles') THEN
    CREATE POLICY "Public profiles are viewable by everyone"
      ON public.profiles FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- User roles policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own roles' AND tablename = 'user_roles') THEN
    CREATE POLICY "Users can view own roles"
      ON public.user_roles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Tools policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Tools are viewable by everyone' AND tablename = 'tools') THEN
    CREATE POLICY "Tools are viewable by everyone"
      ON public.tools FOR SELECT
      USING (is_active = true OR auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage tools' AND tablename = 'tools') THEN
    CREATE POLICY "Admins can manage tools"
      ON public.tools FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
      ));
  END IF;
END $$;

-- Download history policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own download history' AND tablename = 'download_history') THEN
    CREATE POLICY "Users can view own download history"
      ON public.download_history FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert download history' AND tablename = 'download_history') THEN
    CREATE POLICY "Anyone can insert download history"
      ON public.download_history FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Error reports policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own reports' AND tablename = 'error_reports') THEN
    CREATE POLICY "Users can view own reports"
      ON public.error_reports FOR SELECT
      USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can create error reports' AND tablename = 'error_reports') THEN
    CREATE POLICY "Anyone can create error reports"
      ON public.error_reports FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage error reports' AND tablename = 'error_reports') THEN
    CREATE POLICY "Admins can manage error reports"
      ON public.error_reports FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
      ));
  END IF;
END $$;

-- Site settings policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Site settings viewable by everyone' AND tablename = 'site_settings') THEN
    CREATE POLICY "Site settings viewable by everyone"
      ON public.site_settings FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only admins can update settings' AND tablename = 'site_settings') THEN
    CREATE POLICY "Only admins can update settings"
      ON public.site_settings FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
      ));
  END IF;
END $$;

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Next steps:
-- 1. Enable Email provider in Authentication -> Providers
-- 2. Disable email confirmation in Authentication -> Settings (for testing)
-- 3. Create first admin user through the website signup
-- 4. Update user_roles table to set role = 'admin' for that user
