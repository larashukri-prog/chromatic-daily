import posthog from 'posthog-js';

const FALLBACK_KEY = 'phc_NOyFABo6QGDLHMzbRdk2gdSSLUCfpxMNevZYfW5oDwi';
const FALLBACK_HOST = 'https://app.posthog.com';

export function initPostHog() {
  const key = (import.meta.env.VITE_POSTHOG_KEY as string | undefined) || FALLBACK_KEY;
  const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || FALLBACK_HOST;

  if (!key) {
    console.warn('[analytics] VITE_POSTHOG_KEY missing — PostHog disabled');
    return;
  }

  try {
    posthog.init(key, {
      api_host: host,
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      session_recording: {
        recordCrossOriginIframes: true,
      },
    });

    posthog.register({
      project_language: 'English',
      ui_direction: 'LTR',
    });
  } catch (err) {
    console.warn('[analytics] PostHog init failed', err);
  }
}

export { posthog };
