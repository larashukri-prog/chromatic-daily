import posthog from 'posthog-js';

export function initPostHog() {
  posthog.init('phc_NOyFABo6QGDLHMzbRdk2gdSSLUCfpxMNevZYfW5oDwi', {
    api_host: 'https://app.posthog.com',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      recordCrossOriginIframes: true,
    },
  });

  let initialTheme: 'colors' | 'patterns' | 'shapes' = 'colors';
  try {
    const stored = localStorage.getItem('chromatic-visual-theme');
    if (stored === 'patterns' || stored === 'shapes' || stored === 'colors') {
      initialTheme = stored;
    }
  } catch {}

  posthog.register({
    project_language: 'English',
    ui_direction: 'LTR',
    visual_style: initialTheme,
  });
}

export { posthog };
