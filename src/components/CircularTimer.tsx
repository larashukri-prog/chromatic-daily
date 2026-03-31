import { motion } from 'framer-motion';

interface CircularTimerProps {
  /** 0–100, where 100 = full time remaining */
  progress: number;
  /** Total seconds for this round */
  totalSeconds: number;
  /** Size of the component in px */
  size?: number;
}

export function CircularTimer({ progress, totalSeconds, size = 72 }: CircularTimerProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);
  const secondsLeft = Math.ceil((progress / 100) * totalSeconds);

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      {/* Centered number */}
      <span
        className="absolute text-xl font-bold text-foreground tabular-nums"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {secondsLeft}
      </span>
    </div>
  );
}
