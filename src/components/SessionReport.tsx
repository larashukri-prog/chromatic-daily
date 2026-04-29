import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Target, Zap, Eye, Trophy, Share2 } from 'lucide-react';

export type SessionStats = {
  roundsPlayed: number;
  bestSpeed: number;
  totalCorrect: number;
  totalAttempts: number;
  currentStreak: number;
  longestStreak: number;
};

interface SessionReportProps {
  stats: SessionStats;
  copied: boolean;
  onResume: () => void;
  onShare: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

function getInsight(s: SessionStats): string {
  const accuracy = s.totalAttempts ? (s.totalCorrect / s.totalAttempts) * 100 : 0;
  if (s.bestSpeed > 0 && s.bestSpeed < 1.0) return "Elite reflexes. You're ready for the Daily Challenge.";
  if (accuracy > 95) return "Incredible focus. You're in the zone.";
  if (s.longestStreak > 10) return 'Great rhythm! Your consistency is improving.';
  return "You're getting faster! Your reaction time is peaking.";
}

export function SessionReport({ stats, copied, onResume, onShare, onRestart, onMainMenu }: SessionReportProps) {
  const accuracy = stats.totalAttempts ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100) : 0;
  const speedLabel = stats.bestSpeed > 0 ? `${stats.bestSpeed.toFixed(2)}s` : '—';

  const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
    <div className="bg-card/70 border border-border rounded-xl p-3 flex flex-col items-center gap-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <div className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20"
    >
      <div className="absolute inset-0 backdrop-blur-xl bg-white/40" />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6"
      >
        <div className="text-center mb-4">
          <h2
            className="text-2xl tracking-tight text-foreground mb-1.5"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            Session Complete
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed px-2">{getInsight(stats)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <StatCard icon={Target} label="Rounds" value={stats.roundsPlayed} />
          <StatCard icon={Zap} label="Top Speed" value={speedLabel} />
          <StatCard icon={Trophy} label="Wins" value={stats.totalCorrect} />
          <StatCard icon={Eye} label="Focus" value={`${accuracy}%`} />
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <Button
            onClick={onResume}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 text-sm tracking-wide"
          >
            Resume Practice
          </Button>
          <Button
            onClick={onShare}
            variant="outline"
            className="w-full rounded-xl h-10 text-sm gap-2"
          >
            <Share2 className="w-4 h-4" /> Share on WhatsApp
          </Button>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <button onClick={onRestart} className="hover:text-foreground transition-colors underline-offset-2 hover:underline">
            Restart Session
          </button>
          <span className="text-border">·</span>
          <button onClick={onMainMenu} className="hover:text-foreground transition-colors underline-offset-2 hover:underline">
            Main Menu
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}