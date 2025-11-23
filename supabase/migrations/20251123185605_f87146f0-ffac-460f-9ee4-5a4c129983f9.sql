-- Add tool_type column to differentiate between downloadable tools and interactive apps
ALTER TABLE tools ADD COLUMN IF NOT EXISTS tool_type text NOT NULL DEFAULT 'download';

-- Add comment to explain tool types
COMMENT ON COLUMN tools.tool_type IS 'Type of tool: download (traditional download link) or interactive (web-based app)';

-- Add check constraint to ensure valid tool types
ALTER TABLE tools ADD CONSTRAINT tools_tool_type_check 
  CHECK (tool_type IN ('download', 'interactive'));

-- Add app_config column for interactive tools configuration
ALTER TABLE tools ADD COLUMN IF NOT EXISTS app_config jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN tools.app_config IS 'Configuration for interactive apps: { "type": "image-generator", "api": "replicate", "model": "flux-schnell", etc. }';