import { useAccessibility } from '@/hooks/useAccessibility';
import { posthog } from '@/lib/posthog';

export function AccessibilityToggle() {
  const { enabled, toggle } = useAccessibility();

  const handleToggle = () => {
    toggle();
    posthog.capture('Accessibility Toggled', { state: !enabled ? 'ON' : 'OFF' });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
        Accessibility
      </span>
      <button
        onClick={handleToggle}
        className="relative w-[51px] h-[31px] rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ backgroundColor: enabled ? '#34C759' : '#78788033' }}
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle accessibility patterns"
      >
        <span
          className="absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out"
          style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}
