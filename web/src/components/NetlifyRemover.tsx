'use client';

import { useEffect } from 'react';

/**
 * Removes any third-party badge or Netlify feedback drawer / banner injected into DOM
 */
export function NetlifyRemover() {
  useEffect(() => {
    const cleanNetlifyElements = () => {
      const selectors = [
        '#netlify-drawer-container',
        '.netlify-drawer-container',
        '[data-netlify-deploy-id]',
        'iframe[src*="netlify"]',
        'div[class*="netlify-drawer"]',
        'div[class*="netlify-badge"]',
        'div[id*="netlify"]',
      ];

      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          el.remove();
        });
      });

      // Also remove any bottom floating anchors pointing to netlify
      document.querySelectorAll('a[href*="netlify.com"]').forEach((a) => {
        const parent = a.closest('div');
        if (parent && parent !== document.body && !parent.id?.includes('app')) {
          parent.remove();
        } else {
          a.remove();
        }
      });
    };

    cleanNetlifyElements();
    const interval = setInterval(cleanNetlifyElements, 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
