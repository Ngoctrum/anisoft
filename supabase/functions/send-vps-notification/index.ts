import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Payload {
  channelId?: string;
  sessionId?: string;
  userId?: string;
  event?: 'ready' | 'expiring' | 'error' | 'killed';
  test?: boolean;
  message?: string;
}

const EVENT_TEXT: Record<string, { emoji: string; title: string }> = {
  ready:    { emoji: '✅', title: 'VPS sẵn sàng' },
  expiring: { emoji: '⏰', title: 'VPS sắp hết hạn' },
  error:    { emoji: '❌', title: 'VPS gặp lỗi' },
  killed:   { emoji: '🛑', title: 'VPS đã tắt' },
};

async function sendTelegram(cfg: any, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${cfg.bot_token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: cfg.chat_id, text, parse_mode: 'Markdown' }),
  });
  if (!res.ok) throw new Error(`Telegram: ${res.status} ${await res.text()}`);
}

async function sendDiscord(cfg: any, text: string) {
  const res = await fetch(cfg.webhook_url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text }),
  });
  if (!res.ok) throw new Error(`Discord: ${res.status} ${await res.text()}`);
}

async function sendWebhook(cfg: any, payload: any) {
  const res = await fetch(cfg.url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Webhook: ${res.status} ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const body = (await req.json()) as Payload;

    // Load channels
    let channels: any[] = [];
    if (body.channelId) {
      const { data } = await supabase.from('notification_channels').select('*').eq('id', body.channelId).eq('enabled', true);
      channels = data || [];
    } else if (body.userId && body.event) {
      const { data } = await supabase.from('notification_channels').select('*').eq('user_id', body.userId).eq('enabled', true).contains('events', [body.event]);
      channels = data || [];
    }

    if (channels.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, note: 'no channels' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build message
    let title = 'Test notification';
    let details = '';
    if (!body.test && body.event) {
      const meta = EVENT_TEXT[body.event];
      title = `${meta.emoji} ${meta.title}`;
      if (body.sessionId) {
        const { data: sess } = await supabase.from('rdp_sessions').select('*').eq('id', body.sessionId).maybeSingle();
        if (sess) {
          details = `\n• Session: \`${sess.github_repo || sess.id}\`\n• OS: ${sess.os_type || '-'}\n• Networking: ${sess.networking_type || '-'}`;
          if (sess.tailscale_ip) details += `\n• Host: ${sess.tailscale_ip}`;
          if (sess.rdp_user) details += `\n• User: ${sess.rdp_user}`;
          if (sess.expires_at) details += `\n• Expires: ${new Date(sess.expires_at).toLocaleString('vi-VN')}`;
        }
      }
    } else if (body.test) {
      title = '🔔 Test notification từ VPS Console';
      details = '\nNếu bạn thấy tin nhắn này, kênh đã hoạt động!';
    }
    const text = `*${title}*${details}${body.message ? `\n${body.message}` : ''}`;

    const results = await Promise.allSettled(channels.map(async (c) => {
      const cfg = c.config || {};
      if (c.type === 'telegram') await sendTelegram(cfg, text);
      else if (c.type === 'discord') await sendDiscord(cfg, text);
      else if (c.type === 'webhook') await sendWebhook(cfg, {
        event: body.event || 'test', sessionId: body.sessionId, message: text, timestamp: new Date().toISOString(),
      });
      else if (c.type === 'email') {
        // Enqueue via existing email infra if available; fallback: log
        console.log(`[email stub] To: ${cfg.email} | ${text}`);
      }
    }));
    const failures = results.filter(r => r.status === 'rejected').map((r: any) => r.reason?.message || String(r.reason));

    return new Response(JSON.stringify({ success: failures.length === 0, sent: channels.length - failures.length, failures }),
      { status: failures.length > 0 && failures.length === channels.length ? 502 : 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('send-vps-notification error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
