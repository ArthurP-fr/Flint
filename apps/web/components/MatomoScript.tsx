'use client';

import Script from 'next/script';

/**
 * Matomo Analytics Script Component
 * Injects the Matomo tracking script only if MATOMO_URL and MATOMO_SITE_ID are configured
 * 
 * Environment variables:
 * - NEXT_PUBLIC_MATOMO_URL: Base URL of Matomo instance (e.g., https://analytics.arthurp.fr/)
 * - NEXT_PUBLIC_MATOMO_SITE_ID: Site ID in Matomo (e.g., 9)
 */
export function MatomoScript() {
  // Check if Matomo is properly configured
  const matomoUrl = process.env.NEXT_PUBLIC_MATOMO_URL?.trim();
  const matomoSiteId = process.env.NEXT_PUBLIC_MATOMO_SITE_ID?.trim();

  // Skip if not configured
  if (!matomoUrl || !matomoSiteId) {
    return null;
  }

  // Inline script that will be executed immediately
  const matomoCode = `
    var _paq = window._paq = window._paq || [];
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    _paq.push(['setTrackerUrl', '${matomoUrl}matomo.php']);
    _paq.push(['setSiteId', '${matomoSiteId}']);
    (function() {
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.async=true; g.src='${matomoUrl}matomo.js'; s.parentNode.insertBefore(g,s);
    })();
  `;

  return (
    <Script
      id="matomo-analytics"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: matomoCode }}
    />
  );
}
