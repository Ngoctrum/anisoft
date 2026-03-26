import { Button } from '@/components/ui/button';
import { Eye, Link2, Download, Folder } from 'lucide-react';
import type { VideoItem } from './types';

interface VideoListProps {
  videos: VideoItem[];
  onPlay: (video: VideoItem) => void;
  onCopyUrl: (url: string, label?: string) => void;
  onDownload: (video: VideoItem) => void;
}

export function VideoList({ videos, onPlay, onCopyUrl, onDownload }: VideoListProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground w-12">STT</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Tên video</th>
              <th className="text-left p-3 font-medium text-muted-foreground w-32">Thư mục</th>
              <th className="text-left p-3 font-medium text-muted-foreground w-20">Kích thước</th>
              <th className="text-right p-3 font-medium text-muted-foreground w-36">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video, idx) => (
              <tr key={video.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3 text-muted-foreground">{idx + 1}</td>
                <td className="p-3 text-foreground font-medium">{video.name}</td>
                <td className="p-3 text-muted-foreground text-xs">
                  {video.folderPath ? (
                    <span className="flex items-center gap-1">
                      <Folder className="h-3 w-3" />
                      {video.folderPath}
                    </span>
                  ) : '—'}
                </td>
                <td className="p-3 text-muted-foreground">{video.size || '—'}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPlay(video)} title="Xem">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onCopyUrl(video.streamUrl, video.name)} title="Copy URL">
                      <Link2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDownload(video)} title="Tải xuống">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
