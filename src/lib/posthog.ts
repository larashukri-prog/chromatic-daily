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

  posthog.register({
    project_language: 'English',
    ui_direction: 'LTR',
  });
}

export { posthog };
