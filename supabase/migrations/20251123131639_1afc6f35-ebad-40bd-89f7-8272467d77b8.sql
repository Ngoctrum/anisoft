-- Add SMTP settings to site_settings if not exists
INSERT INTO public.site_settings (key, value) 
VALUES ('smtp', '{
  "smtp_host": "",
  "smtp_port": 587,
  "smtp_user": "",
  "smtp_password": "",
  "smtp_from_email": "",
  "smtp_from_name": "Ani Studio"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;