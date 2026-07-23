// SSH/SFTP proxy for VPS File Manager
// Uses ssh2 via npm specifier
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
// @ts-ignore - Deno npm specifier
import { Client } from 'npm:ssh2@1.15.0';
import { Buffer } from 'node:buffer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Req {
  sessionId: string;
  action: 'list' | 'download' | 'upload' | 'delete' | 'mkdir';
  path: string;
  filename?: string;
  content?: string; // base64
}

function sshExec(host: string, port: number, user: string, password: string, cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let out = '', err = '';
    const timer = setTimeout(() => { try { conn.end(); } catch {} reject(new Error('SSH timeout')); }, 15000);
    conn.on('ready', () => {
      conn.exec(cmd, (e: any, stream: any) => {
        if (e) { clearTimeout(timer); conn.end(); return reject(e); }
        stream.on('close', (code: number) => {
          clearTimeout(timer); conn.end();
          if (code !== 0) reject(new Error(err || `Exit ${code}`)); else resolve(out);
        }).on('data', (d: any) => { out += d.toString(); })
          .stderr.on('data', (d: any) => { err += d.toString(); });
      });
    }).on('error', (e: any) => { clearTimeout(timer); reject(e); })
      .connect({ host, port, username: user, password, readyTimeout: 10000 });
  });
}

function sftpGet(host: string, port: number, user: string, password: string, remotePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const timer = setTimeout(() => { try { conn.end(); } catch {} reject(new Error('SFTP timeout')); }, 30000);
    conn.on('ready', () => {
      conn.sftp((e: any, sftp: any) => {
        if (e) { clearTimeout(timer); conn.end(); return reject(e); }
        const chunks: Buffer[] = [];
        const stream = sftp.createReadStream(remotePath);
        stream.on('data', (c: Buffer) => chunks.push(c));
        stream.on('end', () => { clearTimeout(timer); conn.end(); resolve(Buffer.concat(chunks).toString('base64')); });
        stream.on('error', (er: any) => { clearTimeout(timer); conn.end(); reject(er); });
      });
    }).on('error', (e: any) => { clearTimeout(timer); reject(e); })
      .connect({ host, port, username: user, password, readyTimeout: 10000 });
  });
}

function sftpPut(host: string, port: number, user: string, password: string, remotePath: string, base64: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const timer = setTimeout(() => { try { conn.end(); } catch {} reject(new Error('SFTP timeout')); }, 60000);
    conn.on('ready', () => {
      conn.sftp((e: any, sftp: any) => {
        if (e) { clearTimeout(timer); conn.end(); return reject(e); }
        const buf = Buffer.from(base64, 'base64');
        const stream = sftp.createWriteStream(remotePath);
        stream.on('close', () => { clearTimeout(timer); conn.end(); resolve(); });
        stream.on('error', (er: any) => { clearTimeout(timer); conn.end(); reject(er); });
        stream.end(buf);
      });
    }).on('error', (e: any) => { clearTimeout(timer); reject(e); })
      .connect({ host, port, username: user, password, readyTimeout: 10000 });
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: { user }, error: aErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (aErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = (await req.json()) as Req;
    const { data: session, error: sErr } = await supabase.from('rdp_sessions').select('*').eq('id', body.sessionId).maybeSingle();
    if (sErr || !session) return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (session.user_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const os = (session.os_type || '').toLowerCase();
    if (os === 'windows') return new Response(JSON.stringify({ error: 'Windows chưa được hỗ trợ File Manager. Dùng Remote Desktop để copy file.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const host = session.tailscale_ip;
    const port = session.ssh_port || 22;
    const sshUser = session.rdp_user;
    const password = session.rdp_password;
    if (!host || !sshUser || !password) return new Response(JSON.stringify({ error: 'Session chưa có thông tin SSH' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const safePath = (body.path || '~').replace(/[`$"\\]/g, '');

    if (body.action === 'list') {
      const raw = await sshExec(host, port, sshUser, password, `ls -laA --time-style=long-iso "${safePath}" 2>/dev/null || echo __ERR__`);
      const lines = raw.split('\n').filter(Boolean);
      const items = lines.slice(1).map(line => {
        const parts = line.split(/\s+/);
        if (parts.length < 8) return null;
        const perms = parts[0];
        const size = parts[4];
        const date = `${parts[5]} ${parts[6]}`;
        const name = parts.slice(7).join(' ');
        if (name === '.' || name === '..') return null;
        return { name, size: parseInt(size, 10) || 0, isDir: perms.startsWith('d'), modified: date, perms };
      }).filter(Boolean);
      return new Response(JSON.stringify({ items, path: safePath }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.action === 'download') {
      const content = await sftpGet(host, port, sshUser, password, safePath);
      return new Response(JSON.stringify({ content }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.action === 'upload') {
      if (!body.filename || !body.content) return new Response(JSON.stringify({ error: 'Missing filename/content' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const target = `${safePath.replace(/\/$/, '')}/${body.filename.replace(/[/\\]/g, '_')}`;
      await sftpPut(host, port, sshUser, password, target, body.content);
      return new Response(JSON.stringify({ success: true, path: target }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.action === 'delete') {
      await sshExec(host, port, sshUser, password, `rm -rf "${safePath}"`);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.action === 'mkdir') {
      await sshExec(host, port, sshUser, password, `mkdir -p "${safePath}"`);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('vps-file-manager error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
