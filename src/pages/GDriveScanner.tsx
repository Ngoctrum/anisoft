import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  FolderSearch, Key, Copy, FileText, FileSpreadsheet, Play, Search,
  LayoutGrid, List, Loader2, Download, ArrowUpDown, Eye, Link2, Settings2, Trash2
} from 'lucide-react';

interface VideoItem {
  id: string;
  name: string;
  mimeType: string;
  streamUrl: string;
  thumbnailUrl?: string;
  size?: string;
  episodeNumber?: number;
}

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

function extractFolderId(input: string): string | null {
  const match = input.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

function extractEpisodeNumber(name: string): number {
  const patterns = [
    /[Tt](?:ập|ap|p)[\s._-]*(\d+)/i,
    /[Ee](?:p|pisode)?[\s._-]*(\d+)/i,
    /[\s._-](\d+)[\s._-]/,
    /(\d+)/,
  ];
  for (const p of patterns) {
    const m = name.match(p);
    if (m) return parseInt(m[1], 10);
  }
  return 9999;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function GDriveScanner() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gdrive_api_key') || '');
  const [folderUrl, setFolderUrl] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [playerVideo, setPlayerVideo] = useState<VideoItem | null>(null);
  const [showApiSettings, setShowApiSettings] = useState(false);

  useEffect(() => {
    if (apiKey) localStorage.setItem('gdrive_api_key', apiKey);
  }, [apiKey]);

  const fetchViaGoogleApi = useCallback(async (folderId: string): Promise<VideoItem[]> => {
    if (!apiKey) throw new Error('Chưa nhập API Key');
    const items: VideoItem[] = [];
    let pageToken = '';
    do {
      const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'video'&key=${apiKey}&fields=nextPageToken,files(id,name,mimeType,size)&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Google API error: ${res.status}`);
      const data = await res.json();
      for (const f of data.files || []) {
        items.push({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          streamUrl: `https://drive.google.com/file/d/${f.id}/preview`,
          thumbnailUrl: `https://drive.google.com/thumbnail?id=${f.id}&sz=w400`,
          size: f.size ? formatBytes(Number(f.size)) : undefined,
          episodeNumber: extractEpisodeNumber(f.name),
        });
      }
      pageToken = data.nextPageToken || '';
    } while (pageToken);
    return items;
  }, [apiKey]);

  const fetchViaCorsProxy = useCallback(async (folderId: string): Promise<VideoItem[]> => {
    const driveUrl = `https://drive.google.com/drive/folders/${folderId}`;
    for (const proxy of CORS_PROXIES) {
      try {
        const res = await fetch(proxy + encodeURIComponent(driveUrl));
        if (!res.ok) continue;
        const html = await res.text();
        const items: VideoItem[] = [];
        // Extract file IDs from the HTML page
        const regex = /\["([a-zA-Z0-9_-]{28,})","([^"]+\.(?:mp4|mkv|avi|mov|webm|flv|wmv|m4v|ts)[^"]*)",/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
          const [, fileId, fileName] = match;
          items.push({
            id: fileId,
            name: fileName,
            mimeType: 'video/mp4',
            streamUrl: `https://drive.google.com/file/d/${fileId}/preview`,
            thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
            episodeNumber: extractEpisodeNumber(fileName),
          });
        }
        if (items.length > 0) return items;
      } catch { continue; }
    }
    throw new Error('CORS proxy failed');
  }, []);

  const handleScan = async () => {
    const folderId = extractFolderId(folderUrl);
    if (!folderId) {
      toast({ title: 'Lỗi', description: 'URL folder không hợp lệ', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setVideos([]);
    try {
      // Try Google API first, fallback to CORS proxy
      let results: VideoItem[];
      try {
        results = await fetchViaGoogleApi(folderId);
      } catch {
        toast({ title: 'Thông báo', description: 'API Key không khả dụng, đang thử CORS proxy...' });
        results = await fetchViaCorsProxy(folderId);
      }
      if (results.length === 0) {
        toast({ title: 'Không tìm thấy', description: 'Folder không chứa video hoặc không public', variant: 'destructive' });
      } else {
        results.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
        setVideos(results);
        toast({ title: 'Thành công', description: `Tìm thấy ${results.length} video` });
      }
    } catch (err: any) {
      toast({ title: 'Lỗi quét', description: err.message || 'Không thể quét folder', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const q = searchQuery.toLowerCase();
    return videos.filter(v => v.name.toLowerCase().includes(q));
  }, [videos, searchQuery]);

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Đã copy', description: label || 'Đã copy vào clipboard' });
  };

  const copyAllUrls = () => {
    const text = filtered.map(v => v.streamUrl).join('\n');
    copyToClipboard(text, `Đã copy ${filtered.length} URL`);
  };

  const exportTxt = () => {
    const text = filtered.map(v => `${v.name}\n${v.streamUrl}`).join('\n\n');
    downloadFile(text, 'gdrive-videos.txt', 'text/plain');
  };

  const exportCsv = () => {
    const header = 'STT,Tên video,URL';
    const rows = filtered.map((v, i) => `${i + 1},"${v.name.replace(/"/g, '""')}","${v.streamUrl}"`);
    downloadFile([header, ...rows].join('\n'), 'gdrive-videos.csv', 'text/csv');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob(['\ufeff' + content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Đã xuất', description: filename });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-8 space-y-6">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <FolderSearch className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Google Drive Video Scanner</h1>
            <p className="text-muted-foreground">Quét và quản lý video từ Google Drive folder</p>
          </div>
        </div>

        {/* API Key & Folder Input */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" /> Cấu hình
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setShowApiSettings(!showApiSettings)}>
              <Key className="h-4 w-4 mr-1" />
              {apiKey ? 'Đã có API Key' : 'Nhập API Key'}
            </Button>
          </div>

          {showApiSettings && (
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Google API Key (Drive API v3)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-background/50"
              />
              {apiKey && (
                <Button variant="destructive" size="icon" onClick={() => { setApiKey(''); localStorage.removeItem('gdrive_api_key'); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Dán link Google Drive folder vào đây..."
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="bg-background/50"
            />
            <Button onClick={handleScan} disabled={loading} className="bg-[image:var(--gradient-primary)] text-primary-foreground min-w-[120px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FolderSearch className="h-4 w-4 mr-1" /> Quét</>}
            </Button>
          </div>
        </div>

        {/* Results */}
        {videos.length > 0 && (
          <>
            {/* Toolbar */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {filtered.length} / {videos.length} video
                </Badge>

                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm video..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background/50"
                    />
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={copyAllUrls}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy tất cả URL
                </Button>
                <Button variant="outline" size="sm" onClick={exportTxt}>
                  <FileText className="h-3.5 w-3.5 mr-1" /> Xuất TXT
                </Button>
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Xuất CSV
                </Button>
              </div>
            </div>

            {/* Video Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((video, idx) => (
                  <div
                    key={video.id}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group"
                    style={{ boxShadow: 'var(--shadow-card)' }}
                  >
                    <div
                      className="relative aspect-video bg-muted cursor-pointer"
                      onClick={() => setPlayerVideo(video)}
                    >
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-12 w-12 text-primary" />
                      </div>
                      <Badge className="absolute top-2 left-2 bg-background/80 text-foreground text-xs">
                        {idx + 1}
                      </Badge>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium text-foreground line-clamp-2" title={video.name}>
                        {video.name}
                      </p>
                      <div className="flex items-center gap-1">
                        {video.size && (
                          <span className="text-xs text-muted-foreground">{video.size}</span>
                        )}
                        <div className="flex-1" />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPlayerVideo(video)} title="Xem video">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(video.streamUrl, video.name)} title="Copy URL">
                          <Link2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground w-12">STT</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Tên video</th>
                        <th className="text-left p-3 font-medium text-muted-foreground w-20">Kích thước</th>
                        <th className="text-right p-3 font-medium text-muted-foreground w-28">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((video, idx) => (
                        <tr key={video.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-muted-foreground">{idx + 1}</td>
                          <td className="p-3 text-foreground font-medium">{video.name}</td>
                          <td className="p-3 text-muted-foreground">{video.size || '—'}</td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPlayerVideo(video)} title="Xem">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(video.streamUrl, video.name)} title="Copy URL">
                                <Link2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && videos.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <FolderSearch className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground">Dán link folder Google Drive để bắt đầu</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Hỗ trợ quét folder public. Nhập API Key để quét chính xác hơn hoặc dùng CORS proxy như fallback.
            </p>
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      <Dialog open={!!playerVideo} onOpenChange={() => setPlayerVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-foreground pr-8 line-clamp-1">{playerVideo?.name}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {playerVideo && (
              <iframe
                src={playerVideo.streamUrl}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
