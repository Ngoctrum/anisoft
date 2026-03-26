export interface VideoItem {
  id: string;
  name: string;
  mimeType: string;
  streamUrl: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  size?: string;
  sizeBytes?: number;
  episodeNumber?: number;
  folderPath?: string;
}

export interface FolderNode {
  id: string;
  name: string;
  path: string;
  files: VideoItem[];
  subfolders: FolderNode[];
}
