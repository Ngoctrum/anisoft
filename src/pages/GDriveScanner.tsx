import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  FolderSearch, Key, Copy, FileText, FileSpreadsheet, Search,
  LayoutGrid, List, Loader2, Download, Eye, Link2, Settings2, Trash2, FolderDown
} from 'lucide-react';
import { ApiKeyGuide } from '@/components/gdrive/ApiKeyGuide';
import { VideoGrid } from '@/components/gdrive/VideoGrid';
import { VideoList } from '@/components/gdrive/VideoList';
import { VideoPlayer } from '@/components/gdrive/VideoPlayer';
import type { VideoItem } from '@/components/gdrive/types';
import { extractFolderId, extractEpisodeNumber, formatBytes, downloadFile, getDirectDownloadUrl, getStreamUrl } from '@/components/gdrive/utils';

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

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
  const [scanSubfolders, setScanSubfolders] = useState(true);
  const [scanProgress, setScanProgress] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (apiKey) localStorage.setItem('gdrive_api_key', apiKey);
  }, [apiKey]);

  const fetchFolderFiles = useCallback(async (folderId: string, folderPath: string = ''): Promise<VideoItem[]> => {
    if (!apiKey) throw new Error('Chưa nhập API Key');
    const items: VideoItem[] = [];
    let pageToken = '';

    // Fetch ALL files (not just videos) to also find subfolders
    do {
      const query = scanSubfolders
        ? `'${folderId}'+in+parents+and+trashed=false`
        : `'${folderId}'+in+parents+and+mimeType+contains+'video'+and+trashed=false`;

      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&key=${apiKey}&fields=nextPageToken,files(id,name,mimeType,size)&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Google API error: ${res.status}`);
      const data = await res.json();

      for (const f of data.files || []) {
        if (f.mimeType === 'application/vnd.google-apps.folder') {
          if (scanSubfolders) {
            const subPath = folderPath ? `${folderPath}/${f.name}` : f.name;
            setScanProgress(`Đang quét: ${subPath}`);
            const subItems = await fetchFolderFiles(f.id, subPath);
            items.push(...subItems);
          }
        } else if (f.mimeType?.startsWith('video/')) {
          items.push({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            streamUrl: getStreamUrl(f.id),
            downloadUrl: getDirectDownloadUrl(f.id),
            thumbnailUrl: `https://drive.google.com/thumbnail?id=${f.id}&sz=w400`,
            size: f.size ? formatBytes(Number(f.size)) : undefined,
            sizeBytes: f.size ? Number(f.size) : undefined,
            episodeNumber: extractEpisodeNumber(f.name),
            folderPath: folderPath || undefined,
          });
        }
      }
      pageToken = data.nextPageToken || '';
    } while (pageToken);
    return items;
  }, [apiKey, scanSubfolders]);

  const fetchViaCorsProxy = useCallback(async (folderId: string): Promise<VideoItem[]> => {
    const driveUrl = `https://drive.google.com/drive/folders/${folderId}`;
    for (const proxy of CORS_PROXIES) {
      try {
        const res = await fetch(proxy + encodeURIComponent(driveUrl));
        if (!res.ok) continue;
        const html = await res.text();
        const items: VideoItem[] = [];
        const regex = /\["([a-zA-Z0-9_-]{28,})","([^"]+\.(?:mp4|mkv|avi|mov|webm|flv|wmv|m4v|ts)[^"]*)",/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
          const [, fileId, fileName] = match;
          items.push({
            id: fileId,
            name: fileName,
            mimeType: 'video/mp4',
            streamUrl: getStreamUrl(fileId),
            downloadUrl: getDirectDownloadUrl(fileId),
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
    setScanProgress('Đang quét thư mục...');
    try {
      let results: VideoItem[];
      try {
        results = await fetchFolderFiles(folderId);
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
      setScanProgress('');
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const q = searchQuery.toLowerCase();
    return videos.filter(v => v.name.toLowerCase().includes(q) || v.folderPath?.toLowerCase().includes(q));
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
    const text = filtered.map(v => `${v.folderPath ? `[${v.folderPath}] ` : ''}${v.name}\n${v.streamUrl}\nDownload: ${v.downloadUrl}`).join('\n\n');
    downloadFile(text, 'gdrive-videos.txt', 'text/plain');
    toast({ title: 'Đã xuất', description: 'gdrive-videos.txt' });
  };

  const exportCsv = () => {
    const header = 'STT,Thư mục,Tên video,Stream URL,Download URL';
    const rows = filtered.map((v, i) => `${i + 1},"${(v.folderPath || '').replace(/"/g, '""')}","${v.name.replace(/"/g, '""')}","${v.streamUrl}","${v.downloadUrl}"`);
    downloadFile([header, ...rows].join('\n'), 'gdrive-videos.csv', 'text/csv');
    toast({ title: 'Đã xuất', description: 'gdrive-videos.csv' });
  };

  const handleDownloadSingle = (video: VideoItem) => {
    // Open download URL in new tab - works even for view-only files
    window.open(video.downloadUrl, '_blank');
    toast({ title: 'Đang tải', description: `${video.name}` });
  };

  const handleDownloadAll = async () => {
    if (filtered.length === 0) return;
    setDownloading(true);
    toast({ title: 'Bắt đầu tải', description: `Đang mở ${filtered.length} link tải xuống...` });
    
    // Generate a text file with all download links for batch downloading
    const content = filtered.map((v, i) => 
      `${i + 1}. ${v.folderPath ? `[${v.folderPath}] ` : ''}${v.name}\n   ${v.downloadUrl}`
    ).join('\n\n');
    
    downloadFile(content, 'gdrive-download-links.txt', 'text/plain');
    
    // Also open first few files directly (browsers limit popups)
    const batch = filtered.slice(0, 3);
    for (const video of batch) {
      window.open(video.downloadUrl, '_blank');
      await new Promise(r => setTimeout(r, 500));
    }
    
    if (filtered.length > 3) {
      toast({ 
        title: 'Lưu ý', 
        description: `Đã mở 3 link đầu tiên và xuất file chứa ${filtered.length} link tải. Dùng file này với trình download manager (IDM, JDownloader...) để tải hàng loạt.` 
      });
    }
    setDownloading(false);
  };

  // Count unique folders
  const folderCount = useMemo(() => {
    const folders = new Set(videos.filter(v => v.folderPath).map(v => v.folderPath));
    return folders.size;
  }, [videos]);

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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" /> Cấu hình
            </h2>
            <div className="flex items-center gap-2">
              <ApiKeyGuide />
              <Button variant="ghost" size="sm" onClick={() => setShowApiSettings(!showApiSettings)}>
                <Key className="h-4 w-4 mr-1" />
                {apiKey ? 'Đã có API Key' : 'Nhập API Key'}
              </Button>
            </div>
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

          <div className="flex items-center gap-3">
            <Switch id="scan-subfolders" checked={scanSubfolders} onCheckedChange={setScanSubfolders} />
            <Label htmlFor="scan-subfolders" className="text-sm text-foreground cursor-pointer">
              Quét tất cả thư mục con (đệ quy)
            </Label>
          </div>

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

          {loading && scanProgress && (
            <p className="text-xs text-muted-foreground animate-pulse">{scanProgress}</p>
          )}
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
                {folderCount > 0 && (
                  <Badge variant="outline" className="text-sm">
                    {folderCount} thư mục
                  </Badge>
                )}

                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm video hoặc thư mục..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background/50"
                    />
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadAll} 
                  disabled={downloading}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <FolderDown className="h-3.5 w-3.5 mr-1" />
                  {downloading ? 'Đang tải...' : `Tải tất cả (${filtered.length})`}
                </Button>
              </div>
            </div>

            {/* Video Grid/List */}
            {viewMode === 'grid' ? (
              <VideoGrid videos={filtered} onPlay={setPlayerVideo} onCopyUrl={copyToClipboard} onDownload={handleDownloadSingle} />
            ) : (
              <VideoList videos={filtered} onPlay={setPlayerVideo} onCopyUrl={copyToClipboard} onDownload={handleDownloadSingle} />
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && videos.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <FolderSearch className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground">Dán link folder Google Drive để bắt đầu</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Hỗ trợ quét folder public kèm thư mục con. Nhập API Key để quét chính xác hơn hoặc dùng CORS proxy như fallback.
            </p>
          </div>
        )}
      </main>

      <VideoPlayer video={playerVideo} onClose={() => setPlayerVideo(null)} onDownload={handleDownloadSingle} />
      <Footer />
    </div>
  );
}
