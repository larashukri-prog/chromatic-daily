import { posthog } from './posthog';

type Props = Record<string, unknown>;

/**
 * Single safe entry point for every analytics event.
 * No-ops when PostHog never initialized; never throws.
 */
export function track(name: string, props?: Props, options?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    if (!posthog?.__loaded) return;
    posthog.capture(name, props, options as never);
  } catch (err) {
    console.warn('[analytics] capture failed', name, err);
  }
}

/**
 * Push a virtual pageview so SPA-aware analytics scripts (Lovable Analytics,
 * Plausible/Umami, PostHog) record the navigation. Without this, every
 * session looks like a single-pageview "bounce".
 */
export function trackVirtualPageview(path: string, title?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(path, window.location.origin);
    if (window.location.pathname + window.location.search !== url.pathname + url.search) {
      window.history.pushState({ virtual: true }, '', url.toString());
    }
    if (title) {
      try { document.title = title; } catch {}
    }
    // Notify listeners (Lovable Analytics, Plausible, Umami all listen to these).
    window.dispatchEvent(new Event('popstate'));
    window.dispatchEvent(new Event('locationchange'));
    track('$pageview', { $current_url: url.toString(), virtual: true });
  } catch (err) {
    // Never throw from analytics.
    console.warn('[analytics] virtual pageview failed', err);
  }
}

/** Lightweight engagement marker — also flips a sessionStorage flag so we
 * can tell engaged sessions from drive-by loads if needed later. */
export function trackEngagement(name: string, props?: Props): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('cd_engaged', '1');
  } catch {}
  track(name, props);
}
