export function formatCloudinaryFileUrl(url: string | null | undefined): string {
  if (!url) return '#';
  let cleanUrl = url;

  // Fix legacy double extension corruptions
  cleanUrl = cleanUrl.replace(/\.pdf\.pdf$/i, '.pdf').replace(/\.pdf\.jpg$/i, '.pdf');

  // Inject f_jpg transformation for Cloudinary PDF image URLs if missing, to bypass Cloudinary 401 PDF restrictions
  if (cleanUrl.includes('/image/upload/') && !cleanUrl.includes('/f_jpg/')) {
    cleanUrl = cleanUrl.replace('/image/upload/', '/image/upload/f_jpg/');
  }

  return cleanUrl;
}
