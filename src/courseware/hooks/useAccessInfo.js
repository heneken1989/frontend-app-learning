import { useEffect, useState } from 'react';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';

export const DEFAULT_ACCESS_INFO = { access_type: 'free', unit_limit: 20 };

let cachedAccessInfo = null;
let inFlightRequest = null;
const listeners = new Set();

function notifyListeners(accessInfo) {
  listeners.forEach((listener) => listener(accessInfo));
}

export function invalidateAccessInfoCache() {
  cachedAccessInfo = null;
  inFlightRequest = null;
}

export async function fetchAccessInfo({ forceRefresh = false } = {}) {
  if (!forceRefresh && cachedAccessInfo) {
    return cachedAccessInfo;
  }

  if (!forceRefresh && inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = (async () => {
    try {
      const user = getAuthenticatedUser();
      if (!user) {
        cachedAccessInfo = DEFAULT_ACCESS_INFO;
        return cachedAccessInfo;
      }

      const response = await fetch(`${getConfig().LMS_BASE_URL}/api/payment/user/access-info/`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        cachedAccessInfo = data.access_info || DEFAULT_ACCESS_INFO;
      } else {
        cachedAccessInfo = DEFAULT_ACCESS_INFO;
      }
    } catch (error) {
      console.warn('Failed to fetch access_info, defaulting to free:', error);
      cachedAccessInfo = DEFAULT_ACCESS_INFO;
    } finally {
      inFlightRequest = null;
    }

    notifyListeners(cachedAccessInfo);
    return cachedAccessInfo;
  })();

  return inFlightRequest;
}

export async function refreshAccessInfo() {
  invalidateAccessInfoCache();
  return fetchAccessInfo({ forceRefresh: true });
}

export function subscribeAccessInfo(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Shared access_info for payment / unit limits. Dedupes concurrent API calls.
 */
export default function useAccessInfo() {
  const [accessInfo, setAccessInfo] = useState(cachedAccessInfo);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeAccessInfo((data) => {
      if (mounted) {
        setAccessInfo(data);
      }
    });

    fetchAccessInfo().then((data) => {
      if (mounted) {
        setAccessInfo(data);
      }
    });

    const handleRefresh = () => {
      refreshAccessInfo();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'access_info_updated' || !e.key) {
        handleRefresh();
      }
    };

    window.addEventListener('accessInfoUpdated', handleRefresh);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener('accessInfoUpdated', handleRefresh);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return accessInfo;
}
