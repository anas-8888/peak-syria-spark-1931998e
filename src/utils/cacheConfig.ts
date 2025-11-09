/**
 * Cache Configuration Utilities
 * 
 * This module provides utilities for managing cache across the application
 */

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
  // Products
  PRODUCTS: 'products',
  PRODUCT_DETAIL: (id: string) => `product-${id}`,
  PRODUCT_IMAGES: (id: string) => `product-images-${id}`,
  
  // Categories
  CATEGORIES: 'categories',
  CATEGORY_DETAIL: (id: string) => `category-${id}`,
  
  // Orders
  ORDERS: 'orders',
  ORDER_DETAIL: (id: string) => `order-${id}`,
  
  // Cart
  CART_ITEMS: 'cart-items',
  
  // User data
  USER_PROFILE: 'user-profile',
  USER_ORDERS: 'user-orders',
  
  // Dashboard
  DASHBOARD_STATS: 'dashboard-stats',
  DASHBOARD_PAYMENTS: 'dashboard-payments',
  DASHBOARD_ANALYTICS: 'dashboard-analytics',
  
  // Hero slides
  HERO_SLIDES: 'hero-slides',
  
  // Showcases
  SHOWCASES: 'showcases',
  
  // Translations
  TRANSLATIONS: 'translations',
} as const;

/**
 * Cache durations in milliseconds
 */
export const CACHE_DURATIONS = {
  // Short cache (1 minute) - for frequently changing data
  SHORT: 1000 * 60,
  
  // Medium cache (5 minutes) - for moderately changing data
  MEDIUM: 1000 * 60 * 5,
  
  // Long cache (30 minutes) - for rarely changing data
  LONG: 1000 * 60 * 30,
  
  // Very long cache (1 hour) - for static data
  VERY_LONG: 1000 * 60 * 60,
  
  // Permanent cache (24 hours) - for very static data
  PERMANENT: 1000 * 60 * 60 * 24,
} as const;

/**
 * Get cache duration for specific data type
 */
export function getCacheDuration(type: keyof typeof CACHE_DURATIONS): number {
  return CACHE_DURATIONS[type];
}

/**
 * Save data to localStorage with expiration
 */
export function setCachedData<T>(
  key: string,
  data: T,
  expirationMinutes: number = 60
): void {
  try {
    const item = {
      data,
      timestamp: Date.now(),
      expiration: Date.now() + expirationMinutes * 60 * 1000,
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
}

/**
 * Get cached data from localStorage
 */
export function getCachedData<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    
    // Check if expired
    if (Date.now() > parsed.expiration) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed.data as T;
  } catch (error) {
    console.warn('Failed to retrieve cached data:', error);
    return null;
  }
}

/**
 * Clear cached data
 */
export function clearCachedData(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear cached data:', error);
  }
}

/**
 * Clear all cached data
 */
export function clearAllCachedData(): void {
  try {
    // Clear all cache keys except auth and language
    const keysToKeep = ['language', 'sb-zalevlgnfususxctzdzn-auth-token'];
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all cached data:', error);
  }
}

/**
 * Check if cached data exists and is valid
 */
export function isCachedDataValid(key: string): boolean {
  try {
    const item = localStorage.getItem(key);
    if (!item) return false;
    
    const parsed = JSON.parse(item);
    return Date.now() <= parsed.expiration;
  } catch {
    return false;
  }
}

