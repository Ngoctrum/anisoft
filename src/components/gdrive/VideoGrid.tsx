import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, Link2, Download, Folder } from 'lucide-react';
import type { VideoItem } from './types';

interface VideoGridProps {
  videos: VideoItem[];
  onPlay: (video: VideoItem) => void;
  onCopyUrl: (url: string, label?: string) => void;
  onDownload: (video: VideoItem) => void;
}

export function VideoGrid({ videos, onPlay, onCopyUrl, onDownload }: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video, idx) => (
        <div
          key={video.id}
          className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div
            className="relative aspect-video bg-muted cursor-pointer"
            onClick={() => onPlay(video)}
          >
            {video.thumbnailUrl && (
              <img
                src={video.thumbnailUrl}
                alt={video.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
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
            {video.folderPath && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {video.folderPath}
              </p>
            )}
            <div className="flex items-center gap-1">
              {video.size && (
                <span className="text-xs text-muted-foreground">{video.size}</span>
              )}
              <div className="flex-1" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPlay(video)} title="Xem video">
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onCopyUrl(video.streamUrl, video.name)} title="Copy URL">
                <Link2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDownload(video)} title="Tải xuống">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
