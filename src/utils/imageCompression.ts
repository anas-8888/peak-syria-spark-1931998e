/**
 * Image Compression Utilities
 * 
 * This module provides utilities to compress images before upload
 * to reduce file size and improve loading performance
 */

/**
 * Compress an image file before upload
 * 
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise that resolves to a compressed Blob
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0.1 to 1.0
    format?: 'image/jpeg' | 'image/webp' | 'image/png';
  } = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    format = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          format,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get optimal image dimensions for different use cases
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 200, height: 200 },
  small: { width: 400, height: 400 },
  medium: { width: 800, height: 800 },
  large: { width: 1200, height: 1200 },
  hero: { width: 1920, height: 1080 },
  productCard: { width: 400, height: 400 },
  productDetail: { width: 800, height: 800 },
  category: { width: 320, height: 180 },
} as const;

/**
 * Compress image for specific use case
 */
export async function compressImageForUseCase(
  file: File,
  useCase: keyof typeof IMAGE_SIZES,
  quality: number = 0.85
): Promise<Blob> {
  const { width, height } = IMAGE_SIZES[useCase];
  return compressImage(file, {
    maxWidth: width,
    maxHeight: height,
    quality,
    format: 'image/webp'
  });
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Get file size in MB
 */
export function getFileSizeMB(file: File): number {
  return file.size / (1024 * 1024);
}

/**
 * Check if image needs compression (larger than 500KB)
 */
export function needsCompression(file: File): boolean {
  return isImageFile(file) && file.size > 500 * 1024; // 500KB
}

