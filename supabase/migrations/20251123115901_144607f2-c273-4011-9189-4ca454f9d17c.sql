-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('user', 'admin', 'super_admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_blocked BOOLEAN DEFAULT false
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- Create tools table
CREATE TABLE public.tools (
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
  author_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create download_history table
CREATE TABLE public.download_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create error_reports table
CREATE TABLE public.error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create site_settings table
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
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
}'::jsonb);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for tools
CREATE POLICY "Tools are viewable by everyone"
  ON public.tools FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage tools"
  ON public.tools FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  ));

-- RLS Policies for download_history
CREATE POLICY "Users can view own download history"
  ON public.download_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert download history"
  ON public.download_history FOR INSERT
  WITH CHECK (true);

-- RLS Policies for error_reports
CREATE POLICY "Users can view own reports"
  ON public.error_reports FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Anyone can create error reports"
  ON public.error_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage error reports"
  ON public.error_reports FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  ));

-- RLS Policies for site_settings
CREATE POLICY "Site settings viewable by everyone"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update settings"
  ON public.site_settings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  ));

-- Function to check if user has role
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

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_error_reports_updated_at
  BEFORE UPDATE ON public.error_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();