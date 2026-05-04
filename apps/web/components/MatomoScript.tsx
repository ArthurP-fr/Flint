'use client';

import { useEffect } from 'react';

/**
 * Matomo Analytics Script Component
 * Injects the Matomo tracking script only if MATOMO_URL and MATOMO_SITE_ID are configured
 * 
 * Environment variables:
 * - NEXT_PUBLIC_MATOMO_URL: Base URL of Matomo instance (e.g., https://analytics.arthurp.fr/)
 * - NEXT_PUBLIC_MATOMO_SITE_ID: Site ID in Matomo (e.g., 9)
 */
export function MatomoScript() {
  useEffect(() => {
    // Check if Matomo is properly configured
    const matomoUrl = process.env.NEXT_PUBLIC_MATOMO_URL?.trim();
    const matomoSiteId = process.env.NEXT_PUBLIC_MATOMO_SITE_ID?.trim();

    // Skip if not configured
    if (!matomoUrl || !matomoSiteId) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Matomo] Not configured. Skipping analytics.');
      }
      return;
    }

    // Initialize Matomo tracking array
    (window as any)._paq = (window as any)._paq || [];
    const _paq = (window as any)._paq;

    // Set up tracking
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    _paq.push(['setTrackerUrl', `${matomoUrl}matomo.php`]);
    _paq.push(['setSiteId', matomoSiteId]);

    // Inject the Matomo script
    const script = document.createElement('script');
    script.async = true;
    script.src = `${matomoUrl}matomo.js`;
    script.defer = true;

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }
  }, []);

  return null;
}
