import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { VideoItem } from './types';

interface VideoPlayerProps {
  video: VideoItem | null;
  onClose: () => void;
  onDownload: (video: VideoItem) => void;
}

export function VideoPlayer({ video, onClose, onDownload }: VideoPlayerProps) {
  return (
    <Dialog open={!!video} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center gap-2 pr-8">
            <DialogTitle className="text-foreground line-clamp-1 flex-1">{video?.name}</DialogTitle>
            {video && (
              <Button variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => onDownload(video)}>
                <Download className="h-3.5 w-3.5" /> Tải xuống
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="aspect-video w-full">
          {video && (
            <iframe
              src={video.streamUrl}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
