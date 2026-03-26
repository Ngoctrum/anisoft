export function extractFolderId(input: string): string | null {
  const match = input.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

export function extractEpisodeNumber(name: string): number {
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

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob(['\ufeff' + content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getDirectDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function getStreamUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}
