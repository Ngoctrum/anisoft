-- Add new columns to rdp_sessions table for enhanced VPS management
ALTER TABLE rdp_sessions
ADD COLUMN IF NOT EXISTS os_type TEXT DEFAULT 'windows' CHECK (os_type IN ('windows', 'ubuntu')),
ADD COLUMN IF NOT EXISTS vps_config TEXT DEFAULT 'basic' CHECK (vps_config IN ('basic', 'standard', 'premium')),
ADD COLUMN IF NOT EXISTS duration_hours INTEGER DEFAULT 6 CHECK (duration_hours >= 1 AND duration_hours <= 6),
ADD COLUMN IF NOT EXISTS ssh_port INTEGER,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS workflow_run_id TEXT;

-- Add comment
COMMENT ON COLUMN rdp_sessions.os_type IS 'Operating system type: windows or ubuntu';
COMMENT ON COLUMN rdp_sessions.vps_config IS 'VPS configuration tier: basic, standard, or premium';
COMMENT ON COLUMN rdp_sessions.duration_hours IS 'Duration in hours (1-6) before auto-deletion';
COMMENT ON COLUMN rdp_sessions.ssh_port IS 'SSH port for Linux VPS (default 22)';
COMMENT ON COLUMN rdp_sessions.is_active IS 'VPS active status (false = killed)';
COMMENT ON COLUMN rdp_sessions.workflow_run_id IS 'GitHub Actions workflow run ID for managing VPS';