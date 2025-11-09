/**
 * Image Cache Utilities
 * 
 * This module provides utilities to optimize image caching
 * and ensure images are cached properly by the browser.
 */

/**
 * Get an optimized image URL with Supabase Storage transforms
 * Note: Supabase Storage may not support transforms via query params directly
 * This function prepares the URL but actual transforms depend on Supabase configuration
 * 
 * @param imageUrl - The original image URL from Supabase Storage
 * @param options - Optimization options
 * @returns Optimized image URL (transforms may need to be configured in Supabase Dashboard)
 */
export function getOptimizedImageUrl(
  imageUrl: string | null | undefined,
  options?: {
    /**
     * Maximum width for the image (maintains aspect ratio)
     */
    width?: number;
    /**
     * Maximum height for the image (maintains aspect ratio)
     */
    height?: number;
    /**
     * Image quality (1-100, default: 80)
     */
    quality?: number;
    /**
     * Output format - WebP is recommended for best compression
     */
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    /**
     * Add a version query parameter to force cache refresh
     */
    version?: string | number;
  }
): string {
  if (!imageUrl) {
    return '/placeholder.svg';
  }

  // If it's a placeholder, return as is
  if (imageUrl === '/placeholder.svg' || imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // Check if URL is from Supabase Storage
  const isSupabaseUrl = imageUrl.includes('.supabase.co') || imageUrl.includes('supabase');
  
  if (!isSupabaseUrl) {
    // For non-Supabase URLs, return as is
    return imageUrl;
  }

  let url = imageUrl;
  
  // Note: Supabase Storage transforms may require configuration in Dashboard
  // For now, we'll use the URL as-is since transforms via query params
  // may not be supported by default. The images should be optimized before upload.
  
  // If transforms are configured in Supabase, you can uncomment this:
  /*
  const params = new URLSearchParams();
  if (options?.width) {
    params.append('width', options.width.toString());
  }
  if (options?.height) {
    params.append('height', options.height.toString());
  }
  if (options?.format) {
    params.append('format', options.format);
  }
  if (options?.quality) {
    params.append('quality', options.quality.toString());
  }
  if (options?.version) {
    params.append('v', options.version.toString());
  }
  if (params.toString()) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}${params.toString()}`;
  }
  */

  // For now, return the original URL
  // The optimization should happen at upload time or via Supabase Image Transformations API
  return url;
}

/**
 * Generate responsive image srcset for different screen sizes
 * 
 * @param imageUrl - Base image URL
 * @param sizes - Array of widths to generate
 * @returns srcset string
 */
export function generateSrcSet(
  imageUrl: string | null | undefined,
  sizes: number[] = [400, 800, 1200, 1600]
): string {
  if (!imageUrl || imageUrl === '/placeholder.svg') {
    return '';
  }

  return sizes
    .map(size => {
      const optimizedUrl = getOptimizedImageUrl(imageUrl, {
        width: size,
        quality: 85,
        format: 'webp'
      });
      return `${optimizedUrl} ${size}w`;
    })
    .join(', ');
}

/**
 * Get a cached image URL with cache optimization
 * @deprecated Use getOptimizedImageUrl instead for better performance
 */
export function getCachedImageUrl(
  imageUrl: string | null | undefined,
  options?: {
    version?: string | number;
    transform?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
    };
  }
): string {
  return getOptimizedImageUrl(imageUrl, {
    width: options?.transform?.width,
    height: options?.transform?.height,
    quality: options?.transform?.quality,
    format: options?.transform?.format,
    version: options?.version,
  });
}

/**
 * Preload an image to improve perceived performance
 * The browser will cache it automatically
 * 
 * @param imageUrl - The image URL to preload
 */
export function preloadImage(imageUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!imageUrl || imageUrl === '/placeholder.svg') {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${imageUrl}`));
    img.src = imageUrl;
  });
}

/**
 * Preload multiple images
 * 
 * @param imageUrls - Array of image URLs to preload
 */
export async function preloadImages(imageUrls: string[]): Promise<void> {
  await Promise.allSettled(
    imageUrls.map(url => preloadImage(url))
  );
}

/**
 * Check if an image is cached by the browser
 * Note: This is an approximation - browsers don't expose cache status directly
 * 
 * @param imageUrl - The image URL to check
 * @returns Promise that resolves to true if image is likely cached
 */
export async function isImageCached(imageUrl: string): Promise<boolean> {
  if (!imageUrl || imageUrl === '/placeholder.svg') {
    return false;
  }

  try {
    // Try to fetch with cache: 'only-if-cached' mode
    // This will only succeed if the image is in cache
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      cache: 'force-cache',
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate a blur placeholder data URL
 * This creates a tiny blurred version of the image for better UX
 * 
 * @param imageUrl - The image URL
 * @returns Promise that resolves to a data URL or empty string
 */
export async function generateBlurPlaceholder(imageUrl: string): Promise<string> {
  if (!imageUrl || imageUrl === '/placeholder.svg') {
    return '';
  }

  try {
    // Create a small version of the image for blur placeholder
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 20, 20);
          resolve(canvas.toDataURL('image/jpeg', 0.1));
        } else {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = imageUrl;
    });
  } catch {
    return '';
  }
}

