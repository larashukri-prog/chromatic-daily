import { describe, it, expect } from 'vitest';
import { cleanProps, trackOncePersistent } from '@/lib/analytics';

describe('analytics', () => {
  it('strips undefined props', () => {
    expect(cleanProps({ a: 1, b: undefined, c: null })).toEqual({ a: 1, c: null });
  });
  it('daily completion fires once per challenge', () => {
    localStorage.clear();
    expect(trackOncePersistent('daily_done_2026-10-15', 'x')).toBe(true);
    expect(trackOncePersistent('daily_done_2026-10-15', 'x')).toBe(false);
    expect(trackOncePersistent('daily_done_2026-10-16', 'x')).toBe(true);
  });
});
