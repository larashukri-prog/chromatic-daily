import posthog from 'posthog-js';

const FALLBACK_KEY = 'phc_NOyFABo6QGDLHMzbRdk2gdSSLUCfpxMNevZYfW5oDwi';
const FALLBACK_HOST = 'https://us.i.posthog.com';
export const APP_VERSION = '1.0.0';

function getEnvironment(): 'production' | 'development' {
  if (import.meta.env.DEV) return 'development';
  const h = typeof window !== 'undefined' ? window.location.hostname : '';
  // Lovable preview hosts (id-preview--*) are not production traffic.
  if (h === 'localhost' || h.startsWith('id-preview--') || h.includes('lovableproject.com')) return 'development';
  return 'production';
}

export function initPostHog() {
  if (typeof window === 'undefined' || posthog.__loaded) return;
  const key = import.meta.env.VITE_POSTHOG_KEY || FALLBACK_KEY;
  let host = import.meta.env.VITE_POSTHOG_HOST || FALLBACK_HOST;
  // Legacy app host still works but ingest hosts are the supported endpoint.
  if (host.includes('app.posthog.com')) host = FALLBACK_HOST;

  if (!key) {
    console.warn('[analytics] VITE_POSTHOG_KEY missing — PostHog disabled');
    return;
  }

  try {
    posthog.init(key, {
      api_host: host,
      defaults: '2025-05-24',
      persistence: 'localStorage+cookie',
      autocapture: true,
      capture_pageleave: true,
    });
    posthog.register({
      environment: getEnvironment(),
      app_version: APP_VERSION,
      project_language: 'English',
      ui_direction: 'LTR',
    });
  } catch (err) {
    console.warn('[analytics] PostHog init failed', err);
  }
}

export { posthog };
