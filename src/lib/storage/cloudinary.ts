import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  bytes?: number;
  format?: string;
  error?: string;
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  folder: string
): Promise<CloudinaryUploadResult> {
  try {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const isRaw = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'txt'].includes(ext);

    // For raw files (docx, pptx, etc.), public_id needs the extension. For images/pdf, Cloudinary handles format.
    const publicId = isRaw ? `${Date.now()}_${nameWithoutExt}.${ext}` : `${Date.now()}_${nameWithoutExt}`;

    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `english-lms/${folder}`,
          resource_type: isRaw ? 'raw' : 'image',
          public_id: publicId,
        },
        (error, result) => {
          if (error || !result) {
            resolve({
              success: false,
              error: error?.message || 'Failed to upload to Cloudinary CDN.',
            });
          } else {
            let finalUrl = result.secure_url;
            if (ext === 'pdf' && finalUrl.includes('/image/upload/')) {
              finalUrl = finalUrl.replace('/image/upload/', '/image/upload/f_jpg/');
            }
            resolve({
              success: true,
              url: finalUrl,
              bytes: result.bytes,
              format: result.format || ext,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Cloudinary upload failed.',
    };
  }
}

export { formatCloudinaryFileUrl } from '../utils/url-helper';
