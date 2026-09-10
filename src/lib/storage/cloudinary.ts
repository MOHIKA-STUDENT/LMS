import { v2 as cloudinary } from 'cloudinary';
import { processAndValidateFileUpload } from '../utils/asset-shield';

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
    const publicId = ext ? `${Date.now()}_${nameWithoutExt}.${ext}` : `${Date.now()}_${nameWithoutExt}`;

    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `english-lms/${folder}`,
          resource_type: 'auto',
          public_id: publicId,
          flags: 'attachment:false',
        },
        (error, result) => {
          if (error || !result) {
            resolve({
              success: false,
              error: error?.message || 'Failed to upload to Cloudinary CDN.',
            });
          } else {
            resolve({
              success: true,
              url: result.secure_url,
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
