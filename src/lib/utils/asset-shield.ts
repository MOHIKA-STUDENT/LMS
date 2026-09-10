export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  processedFile?: File;
}

export async function processAndValidateFileUpload(file: File): Promise<FileValidationResult> {
  // Check raw size before processing
  if (file.size > MAX_FILE_SIZE_BYTES && !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 5MB limit. Please upload a smaller document.`,
    };
  }

  let finalFile = file;

  // Compress images automatically if in browser environment
  if (typeof window !== 'undefined' && file.type.startsWith('image/')) {
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const options = {
        maxSizeMB: 1, // Compress image to <= 1MB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      finalFile = await imageCompression(file, options);
    } catch (error) {
      console.warn('Image compression fallback to raw file:', error);
    }
  }

  // Final check after compression
  if (finalFile.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size after compression (${(finalFile.size / (1024 * 1024)).toFixed(2)} MB) still exceeds the 5MB limit.`,
    };
  }

  return {
    valid: true,
    processedFile: finalFile,
  };
}
