/**
 * Menu Data Cache
 * Cache menu data in localStorage to avoid repeated API calls
 * Includes versioning and auto-invalidation mechanisms
 */

const CACHE_KEY = 'dropdown_menu_cache';
const CACHE_VERSION_KEY = 'dropdown_menu_cache_version';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const CURRENT_CACHE_VERSION = '1.0.1'; // Increment this when menu structure changes

/**
 * Get the current cache version
 */
const getCacheVersion = () => {
  try {
    return localStorage.getItem(CACHE_VERSION_KEY) || '1.0.0';
  } catch (error) {
    return '1.0.0';
  }
};

/**
 * Set the cache version
 */
const setCacheVersion = (version) => {
  try {
    localStorage.setItem(CACHE_VERSION_KEY, version);
  } catch (error) {
    console.warn('Error setting cache version:', error);
  }
};

/**
 * Check if cache is still valid based on version and expiry
 */
const isCacheValid = (cached) => {
  try {
    const { data, timestamp, version } = cached;
    
    // Check version compatibility
    if (version !== CURRENT_CACHE_VERSION) {
      console.log('🔄 Cache version mismatch, invalidating cache');
      return false;
    }
    
    // Check expiry
    const age = Date.now() - timestamp;
    if (age >= CACHE_EXPIRY) {
      console.log('⏰ Cache expired, invalidating cache');
      return false;
    }
    
    // Check data integrity
    if (!data || !data.courses || !Array.isArray(data.courses)) {
      console.log('⚠️ Cache data invalid, invalidating cache');
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Error validating cache:', error);
    return false;
  }
};

/**
 * Get cached menu data
 * @param {boolean} forceRefresh - If true, ignore cache and return null
 * @returns {Object|null} Cached data or null if not available/valid
 */
export const getCachedMenuData = (forceRefresh = false) => {
  if (forceRefresh) {
    console.log('🔄 Force refresh requested, clearing cache');
    clearMenuCache();
    return null;
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      console.log('📭 No cache found');
      return null;
    }
    
    const parsedCache = JSON.parse(cached);
    
    // Validate cache
    if (!isCacheValid(parsedCache)) {
      clearMenuCache();
      return null;
    }
    
    // Silently return cached data (no log to avoid spam)
    return parsedCache.data;
  } catch (error) {
    console.warn('Error reading menu cache:', error);
    // Clear invalid cache
    clearMenuCache();
    return null;
  }
};

/**
 * Set cached menu data
 * @param {Object} data - Menu data to cache
 */
export const setCachedMenuData = (data) => {
  try {
    if (!data || !data.courses || !Array.isArray(data.courses)) {
      console.warn('⚠️ Invalid data provided to cache');
      return;
    }

    const cacheData = {
      data,
      timestamp: Date.now(),
      version: CURRENT_CACHE_VERSION
    };
    
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setCacheVersion(CURRENT_CACHE_VERSION);
      // Silently cache data (no log to avoid spam)
  } catch (error) {
    console.warn('Error caching menu data:', error);
    // If storage is full, try to clear old cache
    if (error.name === 'QuotaExceededError') {
      console.warn('💾 Storage quota exceeded, clearing old cache');
      clearMenuCache();
    }
  }
};

/**
 * Clear menu cache
 */
export const clearMenuCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('✅ Menu cache cleared');
  } catch (error) {
    console.warn('Error clearing menu cache:', error);
  }
};

/**
 * Invalidate cache on version change or on demand
 */
export const invalidateCache = () => {
  clearMenuCache();
  setCacheVersion('1.0.0'); // Reset version to force refresh
};

/**
 * Get cache info for debugging
 */
export const getCacheInfo = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return { exists: false };
    }
    
    const parsedCache = JSON.parse(cached);
    const age = Date.now() - parsedCache.timestamp;
    
    return {
      exists: true,
      version: parsedCache.version,
      currentVersion: CURRENT_CACHE_VERSION,
      isValid: isCacheValid(parsedCache),
      age: Math.floor(age / 1000 / 60), // Age in minutes
      expiry: Math.floor(CACHE_EXPIRY / 1000 / 60) // Expiry in minutes
    };
  } catch (error) {
    return { exists: false, error: error.message };
  }
};

/**
 * Check if cache needs refresh based on version or expiry
 */
export const shouldRefreshCache = () => {
  const cached = getCachedMenuData();
  return cached === null;
};

