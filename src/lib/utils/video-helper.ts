export function formatEmbedVideoUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // YouTube match (e.g., https://www.youtube.com/watch?v=ID, https://youtu.be/ID, https://www.youtube.com/embed/ID)
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Vimeo match (e.g., https://vimeo.com/ID or https://player.vimeo.com/video/ID)
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return trimmed;
}

export function getYouTubeThumbnail(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const ytMatch = url.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }
  return null;
}

export function isYouTubeOrVimeo(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url.toLowerCase());
}
