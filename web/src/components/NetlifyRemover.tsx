'use client';

import { useEffect } from 'react';

/**
 * Actively and instantaneously destroys any third-party badge, iframe or Netlify drawer
 */
export function NetlifyRemover() {
  useEffect(() => {
    const removeElements = () => {
      // 1. Selector query
      const selectors = [
        'netlify-drawer',
        'netlify-cdp-drawer',
        'netlify-feedback',
        'netlify-badge',
        '#netlify-drawer-container',
        '.netlify-drawer-container',
        '[data-netlify-deploy-id]',
        'iframe[src*="netlify"]',
        'div[class*="netlify"]',
        'div[id*="netlify"]',
        'button[class*="netlify"]',
        'a[href*="netlify.com"]',
        'a[href*="netlify.app"]',
      ];

      selectors.forEach((selector) => {
        try {
          document.querySelectorAll(selector).forEach((el) => {
            el.remove();
          });
        } catch {
          // Ignore invalid selector in older browsers
        }
      });

      // 2. Custom tags and floating fixed badges at the bottom of the page
      document.querySelectorAll('*').forEach((el) => {
        const tagName = el.tagName.toLowerCase();
        if (tagName.includes('netlify')) {
          el.remove();
          return;
        }

        // Check if it's a fixed floating element containing "Powered by Netlify" or "netlify" text
        const style = window.getComputedStyle(el);
        if (
          style.position === 'fixed' &&
          (style.bottom === '0px' || parseInt(style.bottom) < 50)
        ) {
          const text = (el.textContent || '').toLowerCase();
          if (
            text.includes('powered by netlify') ||
            text.includes('deploys by netlify') ||
            text.includes('netlify')
          ) {
            // Ensure we don't remove our own MobileNav
            if (!el.querySelector('nav')) {
              el.remove();
            }
          }
        }
      });
    };

    removeElements();

    // Instant removal using MutationObserver
    const observer = new MutationObserver(() => {
      removeElements();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    const interval = setInterval(removeElements, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}
