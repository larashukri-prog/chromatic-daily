import { useVisualTheme, type VisualTheme } from '@/hooks/useAccessibility';
import { posthog } from '@/lib/posthog';
import { cn } from '@/lib/utils';

const OPTIONS: { value: VisualTheme; label: string }[] = [
  { value: 'colors', label: 'Colors' },
  { value: 'patterns', label: 'Patterns' },
  { value: 'shapes', label: 'Shapes' },
  { value: 'knicks', label: 'Go Knicks' },
];

export function VisualThemeToggle() {
  const { theme, setTheme } = useVisualTheme();

  const handleChange = (next: VisualTheme) => {
    if (next === theme) return;
    const previous = theme;
    setTheme(next);
    posthog.capture('visual_theme_changed', {
      theme: next,
      previous_theme: previous,
    });

    try {
      const TOUCHED_KEY = 'chromatic-visual-theme-touched';
      if (!localStorage.getItem(TOUCHED_KEY)) {
        localStorage.setItem(TOUCHED_KEY, '1');
        posthog.capture('visual_style_first_set', {
          theme: next,
          previous_theme: previous,
        });
      }
    } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
        Visual Style
      </span>
      <div
        role="radiogroup"
        aria-label="Visual style"
        className="inline-flex items-center rounded-full border border-border bg-card p-0.5 shadow-sm"
      >
        {OPTIONS.map((opt) => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={active}
              onClick={() => handleChange(opt.value)}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
