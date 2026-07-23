import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Folder, File as FileIcon, ArrowLeft, RefreshCw, Upload, Download, Trash2, FolderPlus, Loader2, Home } from 'lucide-react';

interface Item { name: string; size: number; isDir: boolean; modified: string; perms: string; }

export function VPSFileManager({ sessionId, sessionName, open, onClose }: {
  sessionId: string; sessionName: string; open: boolean; onClose: () => void;
}) {
  const [path, setPath] = useState('~');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const call = async (action: string, extra: any = {}) => {
    const { data, error } = await supabase.functions.invoke('vps-file-manager', {
      body: { sessionId, action, path, ...extra },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data;
  };

  const load = async (p = path) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vps-file-manager', {
        body: { sessionId, action: 'list', path: p },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setItems((data as any).items || []);
      setPath(p);
    } catch (e: any) {
      toast.error('Lỗi tải: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load('~'); }, [open, sessionId]);

  const enter = (item: Item) => {
    if (!item.isDir) return;
    const next = path === '~' ? `~/${item.name}` : `${path}/${item.name}`;
    load(next);
  };

  const goUp = () => {
    if (path === '~' || path === '/') return;
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    load(parts.length === 0 ? '/' : (path.startsWith('~') && parts.length === 1 ? '~' : '/' + parts.join('/')));
  };

  const download = async (name: string) => {
    try {
      const filePath = path === '~' ? `~/${name}` : `${path}/${name}`;
      const data: any = await call('download', { path: filePath });
      const bin = atob(data.content);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([arr]));
      const a = document.createElement('a'); a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { toast.error('Lỗi tải: ' + e.message); }
  };

  const upload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error('File > 10MB. Dùng SCP trực tiếp.'); return; }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      let bin = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      await call('upload', { filename: file.name, content: b64 });
      toast.success(`Đã upload ${file.name}`);
      load();
    } catch (e: any) { toast.error('Lỗi upload: ' + e.message); }
    finally { setUploading(false); }
  };

  const remove = async (name: string) => {
    if (!confirm(`Xóa ${name}?`)) return;
    try {
      const p = path === '~' ? `~/${name}` : `${path}/${name}`;
      await call('delete', { path: p });
      toast.success('Đã xóa'); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const mkdir = async () => {
    const name = prompt('Tên folder mới:'); if (!name) return;
    try {
      const p = path === '~' ? `~/${name}` : `${path}/${name}`;
      await call('mkdir', { path: p });
      toast.success('Đã tạo'); load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>File Manager — {sessionName}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => load('~')}><Home className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={goUp} disabled={path === '~' || path === '/'}><ArrowLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => load()}><RefreshCw className="h-4 w-4" /></Button>
          <Input value={path} onChange={e => setPath(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(path)} className="flex-1 min-w-[200px] font-mono text-sm" />
          <Button size="sm" variant="outline" onClick={mkdir}><FolderPlus className="h-4 w-4 mr-1" /> Folder</Button>
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />} Upload
          </Button>
          <input ref={inputRef} type="file" hidden onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
        </div>

        <div className="flex-1 overflow-auto border rounded-lg">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Thư mục trống</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2">Tên</th>
                  <th className="text-left p-2 w-24">Size</th>
                  <th className="text-left p-2 w-40">Modified</th>
                  <th className="text-right p-2 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.name} className="border-t hover:bg-muted/30">
                    <td className="p-2">
                      <button onClick={() => enter(item)} className="flex items-center gap-2 hover:text-primary text-left">
                        {item.isDir ? <Folder className="h-4 w-4 text-sky-500" /> : <FileIcon className="h-4 w-4 text-muted-foreground" />}
                        {item.name}
                      </button>
                    </td>
                    <td className="p-2 text-muted-foreground">{item.isDir ? '—' : formatSize(item.size)}</td>
                    <td className="p-2 text-muted-foreground text-xs">{item.modified}</td>
                    <td className="p-2 text-right">
                      {!item.isDir && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => download(item.name)}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(item.name)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Chỉ hỗ trợ Linux VPS. Upload tối đa 10MB — file lớn dùng <code>scp</code> trực tiếp.</p>
      </DialogContent>
    </Dialog>
  );
}

function formatSize(b: number) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB';
  return (b / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}
