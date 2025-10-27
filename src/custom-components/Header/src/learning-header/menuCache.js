/**
 * Menu Data Cache
 * Cache menu data in localStorage to avoid repeated API calls
 */

const CACHE_KEY = 'dropdown_menu_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const getCachedMenuData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Return data if cache is still valid
    if (age < CACHE_EXPIRY) {
      console.log('✅ Using cached menu data');
      return data;
    }
    
    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.warn('Error reading menu cache:', error);
    return null;
  }
};

export const setCachedMenuData = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    console.log('✅ Menu data cached successfully');
  } catch (error) {
    console.warn('Error caching menu data:', error);
  }
};

export const clearMenuCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('✅ Menu cache cleared');
  } catch (error) {
    console.warn('Error clearing menu cache:', error);
  }
};

// Invalidate cache on version change or on demand
export const invalidateCache = () => {
  clearMenuCache();
};

