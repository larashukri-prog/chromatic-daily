import { toIsoDate, type TeamCode } from './fifaSchedule';

/** Manually curated per-day flag list (ISO alpha-2 for flagcdn).
 *  Keyed by local-date YYYY-MM-DD. Order does not matter; FifaOverlay
 *  shuffles deterministically per date. */
export const FIFA_DAILY_FLAGS: Record<string, TeamCode[]> = {
  '2026-06-15': ['es', 'cv', 'be', 'eg', 'sa', 'uy', 'ir', 'nz'],
};

export function getFlagsForDate(date: Date): TeamCode[] | null {
  return FIFA_DAILY_FLAGS[toIsoDate(date)] ?? null;
}