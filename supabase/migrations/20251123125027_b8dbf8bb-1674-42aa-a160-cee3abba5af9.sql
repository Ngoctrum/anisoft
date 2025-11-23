-- Add badge/status tag field to tools table for highlighting
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS status_badge text;

COMMENT ON COLUMN public.tools.status_badge IS 'Display badge like "new", "updated", "hot", etc.';

-- Add support_type field to error_reports for different categories
ALTER TABLE public.error_reports ADD COLUMN IF NOT EXISTS support_type text DEFAULT 'tool_error';

COMMENT ON COLUMN public.error_reports.support_type IS 'Type of support request: tool_error, code_error, website_error, website_report, general, support_request';

-- Update existing records to have default support_type
UPDATE public.error_reports SET support_type = 'tool_error' WHERE support_type IS NULL;