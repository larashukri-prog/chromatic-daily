import { motion } from 'framer-motion';

interface CircularTimerProps {
  /** 0–100, where 100 = full time remaining */
  progress: number;
  /** Total seconds for this round */
  totalSeconds: number;
  /** Size of the component in px */
  size?: number;
}

export function CircularTimer({ progress, totalSeconds, size = 28 }: CircularTimerProps) {
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);
  const secondsLeft = Math.ceil((progress / 100) * totalSeconds);
  const fontSize = size * 0.4;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <span
        className="absolute text-muted-foreground font-semibold tabular-nums leading-none"
        style={{ fontSize }}
      >
        {secondsLeft}
      </span>
    </div>
  );
}