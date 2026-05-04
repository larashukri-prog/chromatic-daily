import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Target, Zap, Crown, Brain, Share2, Loader2 } from 'lucide-react';

export type SessionStats = {
  roundsPlayed: number;
  totalCorrect: number;
  currentStreak: number;
  longestStreak: number;
  /** recallSeconds for each correct round (in order). */
  correctTimes: number[];
  /** Cumulative correctly-placed tiles across all successful rounds. */
  tilesDecoded: number;
  /** Largest successful round in the session (tie-broken by faster time). */
  peakComplexity: { tiles: number; seconds: number } | null;
};

function computeReflexAvg(times: number[]): number | null {
  if (!times.length) return null;
  const sorted = [...times].sort((a, b) => a - b).slice(0, 3);
  return sorted.reduce((s, n) => s + n, 0) / sorted.length;
}

interface SessionReportProps {
  stats: SessionStats;
  onResume: () => void;
  onShare?: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

function getInsight(s: SessionStats): string {
  const consistency = s.roundsPlayed ? (s.totalCorrect / s.roundsPlayed) * 100 : 0;
  const reflex = computeReflexAvg(s.correctTimes);
  if (reflex !== null && reflex < 1.0) return "Elite reflexes. You're ready for the Daily Challenge.";
  if (consistency > 95) return "Incredible focus. You're in the zone.";
  if (s.longestStreak > 10) return 'Great rhythm! Your consistency is improving.';
  return "You're getting faster! Your reaction time is peaking.";
}

export function SessionReport({ stats, onResume, onShare, onRestart, onMainMenu }: SessionReportProps) {
  const consistency = stats.roundsPlayed ? Math.round((stats.totalCorrect / stats.roundsPlayed) * 100) : 0;
  const reflexAvg = computeReflexAvg(stats.correctTimes);
  const reflexLabel = reflexAvg !== null ? `${reflexAvg.toFixed(2)}s` : '—';
  const peakLabel = stats.peakComplexity
    ? `${stats.peakComplexity.tiles} in ${stats.peakComplexity.seconds.toFixed(1)}s`
    : '—';
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleShareCard = async () => {
    if (!cardRef.current || isCapturing) return;
    setIsCapturing(true);
    const cardEl = cardRef.current;
    // Save originals so we can restore after capture.
    const prevWidth = cardEl.style.width;
    const prevMaxWidth = cardEl.style.maxWidth;
    const prevWebkitSmoothing = (cardEl.style as any).webkitFontSmoothing as string;
    const prevMozSmoothing = (cardEl.style as any).MozOsxFontSmoothing as string;
    try {
      // Yield once so React commits the spinner/disabled state before heavy work runs.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      // Lock card to a fixed width so the snapshot doesn't reflow at higher pixel ratios.
      cardEl.style.width = '420px';
      cardEl.style.maxWidth = '420px';
      (cardEl.style as any).webkitFontSmoothing = 'antialiased';
      (cardEl.style as any).MozOsxFontSmoothing = 'grayscale';

      // Wait two frames so DOM reflects hidden buttons + visible footer.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );

      // Default to 3x for crisp retina output; downshift to 2x on lower-end devices
      // or after we've recorded a slow capture in this session.
      const isMobileUA = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const lowMemory =
        ((navigator as any).deviceMemory ?? 8) <= 4 ||
        (navigator.hardwareConcurrency ?? 8) <= 4;
      const lowResFlag =
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('chromatic:lowResShare') === '1';
      const pixelRatio = lowResFlag || (isMobileUA && lowMemory) ? 2 : 3;

      const t0 = performance.now();
      const dataUrl = await htmlToImage.toPng(cardEl, {
        pixelRatio,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });
      const elapsed = performance.now() - t0;
      if (pixelRatio === 3 && elapsed > 1500) {
        try {
          sessionStorage.setItem('chromatic:lowResShare', '1');
        } catch {}
        console.info(`[Chromatic] Share capture ${elapsed.toFixed(0)}ms — downshifting to 2x next time.`);
      }
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'Chromatic_Practice_Results.png', { type: 'image/png' });

      onShare?.();

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const reflex = reflexAvg !== null ? `${reflexAvg.toFixed(2)}s` : '—';
      const caption = `My Chromatic Practice Stats ⚡️\nRounds: ${stats.roundsPlayed} · Consistency: ${consistency}% · Reflex: ${reflex}\n\nhttps://chromatic-daily.lovable.app`;

      const canShareFiles =
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });

      if (isMobile && canShareFiles) {
        // Mobile: native share sheet — WhatsApp accepts the PNG file + caption directly.
        try {
          await navigator.share({
            files: [file],
            title: 'My Chromatic Practice Stats',
            text: caption,
          });
        } catch (err: any) {
          if (err?.name !== 'AbortError') throw err;
        }
      } else {
        // Desktop fallback: download PNG, then open WhatsApp Web with caption so user can attach the saved image.
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'Chromatic_Practice_Results.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, '_blank');
      }
    } catch (err) {
      console.error('[Chromatic] Share card failed:', err);
    } finally {
      // Restore card styles regardless of success/failure.
      cardEl.style.width = prevWidth;
      cardEl.style.maxWidth = prevMaxWidth;
      (cardEl.style as any).webkitFontSmoothing = prevWebkitSmoothing ?? '';
      (cardEl.style as any).MozOsxFontSmoothing = prevMozSmoothing ?? '';
      setIsCapturing(false);
    }
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    valueClassName,
  }: {
    icon: any;
    label: string;
    value: string | number;
    valueClassName?: string;
  }) => (
    <div className="bg-card/70 border border-border rounded-xl p-3 flex flex-col items-center gap-1">
      <Icon className={`w-4 h-4 text-muted-foreground ${isCapturing ? 'hidden' : ''}`} />
      <div
        className={`font-semibold text-foreground ${valueClassName ?? 'text-xl'}`}
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {value}
      </div>
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
        ref={cardRef}
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
            Practice Session Complete
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed px-2">{getInsight(stats)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <StatCard icon={Target} label="Rounds" value={stats.roundsPlayed} />
          <StatCard icon={Zap} label="Reflex Avg" value={reflexLabel} />
          <StatCard icon={Crown} label="Peak" value={peakLabel} valueClassName="text-base" />
          <StatCard icon={Brain} label="Decoded" value={stats.tilesDecoded} />
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <Button
            onClick={onResume}
            className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 text-sm tracking-wide ${isCapturing ? 'hidden' : ''}`}
          >
            Resume Practice
          </Button>
          <Button
            onClick={handleShareCard}
            variant="outline"
            disabled={isCapturing}
            className={`w-full rounded-xl h-10 text-sm gap-2 ${isCapturing ? 'hidden' : ''}`}
          >
            {isCapturing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" /> Share Card
              </>
            )}
          </Button>
        </div>

        <div className={`flex items-center justify-center gap-3 text-xs text-muted-foreground ${isCapturing ? 'hidden' : ''}`}>
          <button onClick={onRestart} className="hover:text-foreground transition-colors underline-offset-2 hover:underline">
            Restart Session
          </button>
          <span className="text-border">·</span>
          <button onClick={onMainMenu} className="hover:text-foreground transition-colors underline-offset-2 hover:underline">
            Main Menu
          </button>
        </div>

        {isCapturing && (
          <div className="flex items-center justify-center gap-2 pt-2 mt-2 border-t border-border">
            <img
              src="/share-logo.png"
              alt="Chromatic"
              className="h-6 w-auto"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span
              className="text-foreground text-sm"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
            >
              ChromaticDaily
            </span>
            <span className="text-muted-foreground text-xs">· chromatic-daily.lovable.app</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}