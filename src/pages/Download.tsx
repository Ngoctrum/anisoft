import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AlertTriangle, Download as DownloadIcon, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Download() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tool, setTool] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);
  const [canDownload, setCanDownload] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && settings) {
      setCanDownload(true);
      if (settings.enable_auto_redirect && tool?.download_url) {
        handleDownload();
      }
    }
  }, [countdown, settings, tool]);

  const loadData = async () => {
    if (!id) return;

    // Load tool
    const { data: toolData, error: toolError } = await supabase
      .from('tools')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

    if (toolError || !toolData) {
      toast.error('Không tìm thấy tool');
      navigate('/tools');
      return;
    }

    setTool(toolData);

    // Load settings
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'download')
      .maybeSingle();

    const downloadSettings = (settingsData?.value as any) || {
      download_countdown_seconds: 5,
      download_warning_text: 'Các code / tools trên website Ani Studio đều do Team Ani Studio hoặc cộng đồng chia sẻ.',
      enable_download_history: true,
      enable_auto_redirect: true
    };

    setSettings(downloadSettings);
    setCountdown(downloadSettings.download_countdown_seconds);
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!tool || !canDownload) return;

    // Record download history
    if (settings?.enable_download_history) {
      await supabase.from('download_history').insert({
        user_id: user?.id || null,
        tool_id: tool.id,
        ip_address: null,
        user_agent: navigator.userAgent
      });

      // Update download count
      await supabase
        .from('tools')
        .update({ total_downloads: (tool.total_downloads || 0) + 1 })
        .eq('id', tool.id);
    }

    // Redirect to download URL
    window.location.href = tool.download_url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl bg-gradient-card border-border">
        <CardContent className="p-8 space-y-6">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center space-x-2">
            <div className="h-12 w-12 rounded-lg bg-gradient-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Ani Studio
            </span>
          </Link>

          {/* Tool info */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{tool?.title}</h1>
            <p className="text-muted-foreground">{tool?.short_description}</p>
          </div>

          {/* Warning */}
          {settings?.download_warning_text && (
            <Alert className="bg-destructive/10 border-destructive/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {settings.download_warning_text}
              </AlertDescription>
            </Alert>
          )}

          {/* Countdown or Download button */}
          <div className="text-center space-y-4">
            {countdown > 0 ? (
              <div className="space-y-4">
                <div className="text-6xl font-bold text-primary">
                  {countdown}
                </div>
                <p className="text-muted-foreground">
                  Vui lòng đợi để tiếp tục tải xuống...
                </p>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full bg-gradient-primary"
                onClick={handleDownload}
              >
                <DownloadIcon className="mr-2 h-5 w-5" />
                Tải xuống ngay
              </Button>
            )}
          </div>

          {/* Back button */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate(`/tools/${tool?.slug}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}