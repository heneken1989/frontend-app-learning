import { useEffect, useState } from 'react';
import { getConfig } from '@edx/frontend-platform';

let cachedPaymentStatus = null;
let inFlightPaymentStatus = null;

export function invalidatePaymentStatusCache() {
  cachedPaymentStatus = null;
  inFlightPaymentStatus = null;
}

export async function fetchPaymentStatusBundle() {
  if (cachedPaymentStatus) {
    return cachedPaymentStatus;
  }

  if (inFlightPaymentStatus) {
    return inFlightPaymentStatus;
  }

  const lmsBaseUrl = getConfig().LMS_BASE_URL;
  inFlightPaymentStatus = Promise.all([
    fetch(`${lmsBaseUrl}/api/payment/subscription/status/`, {
      method: 'GET',
      credentials: 'include',
    }).then((response) => (response.ok ? response.json() : null)),
    fetch(`${lmsBaseUrl}/api/payment/enrollment/status/`, {
      method: 'GET',
      credentials: 'include',
    }).then((response) => (response.ok ? response.json() : null)),
  ]).then(([subscription, enrollment]) => {
    cachedPaymentStatus = { subscription, enrollment };
    inFlightPaymentStatus = null;
    return cachedPaymentStatus;
  }).catch((error) => {
    inFlightPaymentStatus = null;
    throw error;
  });

  return inFlightPaymentStatus;
}

/**
 * Subscription + enrollment status (debug/header). Dedupes concurrent calls.
 */
export default function usePaymentStatus(enabled = true) {
  const [subscriptionInfo, setSubscriptionInfo] = useState(
    () => cachedPaymentStatus?.subscription ?? null,
  );
  const [enrollmentInfo, setEnrollmentInfo] = useState(
    () => cachedPaymentStatus?.enrollment ?? null,
  );

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let mounted = true;

    fetchPaymentStatusBundle()
      .then(({ subscription, enrollment }) => {
        if (!mounted) {
          return;
        }
        setSubscriptionInfo(subscription);
        setEnrollmentInfo(enrollment);
      })
      .catch(() => {
        // Ignore — header works without debug payment data
      });

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return { subscriptionInfo, enrollmentInfo };
}
