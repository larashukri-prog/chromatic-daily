import { posthog } from './posthog';

type Primitive = string | number | boolean | null;
type Props = Record<string, Primitive | undefined>;

export type GameMode = 'daily' | 'practice';

/** Typed schema for canonical events. Legacy events keep loose Props. See ANALYTICS.md. */
export interface AnalyticsEvents {
  game_started: { game_mode: GameMode; challenge_id?: string; stage_number?: number } & Props;
  game_stage_started: { game_mode: GameMode; challenge_id?: string; stage_number: number } & Props;
  game_stage_completed: {
    game_mode: GameMode;
    challenge_id?: string;
    stage_number: number;
    is_correct: boolean;
    speed_star_earned: boolean;
  } & Props;
  daily_challenge_completed: {
    game_mode: 'daily';
    challenge_id: string;
    stages_completed: number;
    completion_time_ms: number;
    speed_star_earned: boolean;
  } & Props;
  share_clicked: { game_mode: GameMode; challenge_id?: string; share_method: string } & Props;
  practice_started: Props;
}

/** Drops undefined values so PostHog never receives inconsistent types. */
export function cleanProps(props?: Props): Record<string, Primitive> | undefined {
  if (!props) return undefined;
  const out: Record<string, Primitive> = {};
  for (const [k, v] of Object.entries(props)) if (v !== undefined) out[k] = v;
  return out;
}

/** Single safe entry point for every analytics event. Never throws. */
export function track<E extends string>(
  name: E,
  props?: E extends keyof AnalyticsEvents ? AnalyticsEvents[E] : Props,
): void {
  if (typeof window === 'undefined') return;
  try {
    if (!posthog?.__loaded) return;
    posthog.capture(name, cleanProps(props as Props));
  } catch (err) {
    console.warn('[analytics] capture failed', name, err);
  }
}

const memo = new Set<string>();
/** Fire an event at most once per key for this page session (guards re-renders/StrictMode). */
export function trackOnce<E extends string>(
  key: string,
  name: E,
  props?: E extends keyof AnalyticsEvents ? AnalyticsEvents[E] : Props,
): boolean {
  if (memo.has(key)) return false;
  memo.add(key);
  track(name, props);
  return true;
}

/** Fire at most once per key ever on this device (e.g. daily completion per challenge). */
export function trackOncePersistent<E extends string>(
  key: string,
  name: E,
  props?: E extends keyof AnalyticsEvents ? AnalyticsEvents[E] : Props,
): boolean {
  const storageKey = `cd_evt_${key}`;
  try {
    if (localStorage.getItem(storageKey)) return false;
    localStorage.setItem(storageKey, '1');
  } catch {
    if (memo.has(storageKey)) return false;
    memo.add(storageKey);
  }
  track(name, props);
  return true;
}

/**
 * Update the URL for a virtual screen. PostHog's history_change tracking records
 * the $pageview itself — no manual capture, no synthetic events. Existing query
 * params (UTMs) are preserved.
 */
export function trackVirtualPageview(path: string, title?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(path, window.location.origin);
    if (!url.search) url.search = window.location.search;
    if (window.location.pathname + window.location.search !== url.pathname + url.search) {
      window.history.pushState({ virtual: true }, '', url.toString());
    }
    if (title) document.title = title;
  } catch (err) {
    console.warn('[analytics] virtual pageview failed', err);
  }
}

export function trackEngagement(name: string, props?: Props): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem('cd_engaged', '1'); } catch {}
  track(name, props);
}
