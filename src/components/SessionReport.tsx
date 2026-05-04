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
  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleShareCard = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      // Wait two frames: 1) React commits styles, 2) browser paints them.
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (!captureRef.current) return;
      const node = captureRef.current;
      const dataUrl = await htmlToImage.toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
        skipFonts: false,
      });
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
        // Copy caption to clipboard so user can paste it alongside the saved PNG.
        // (wa.me redirects to api.whatsapp.com which is blocked in embedded/iframe contexts.)
        try { await navigator.clipboard?.writeText(caption); } catch {}
      }
    } catch (err) {
      console.error('[Chromatic] Share card failed:', err);
    } finally {
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
      <Icon className="w-4 h-4 text-muted-foreground" />
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

      </motion.div>

      <div
        aria-hidden
        ref={captureRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
          width: '420px',
          padding: '24px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          color: '#111',
          boxSizing: 'border-box',
        }}
      >
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
              Practice Session Complete
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
              {getInsight(stats)}
            </div>
          </div>

          {[
            { Icon: Target, label: 'Rounds', value: String(stats.roundsPlayed) },
            { Icon: Zap, label: 'Reflex Avg', value: reflexLabel },
            { Icon: Crown, label: 'Peak', value: peakLabel },
            { Icon: Brain, label: 'Decoded', value: String(stats.tilesDecoded) },
          ].map(({ Icon, label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                marginBottom: '8px',
              }}
            >
              <Icon style={{ width: 18, height: 18, flexShrink: 0, color: '#6b7280' }} />
              <span style={{ flexShrink: 0, fontWeight: 600, fontSize: 18, color: '#111' }}>
                {value}
              </span>
              <span
                style={{
                  flexShrink: 0,
                  marginLeft: 'auto',
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#6b7280',
                }}
              >
                {label}
              </span>
            </div>
          ))}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <img
              src="/share-logo.png"
              alt=""
              style={{ height: 20, flexShrink: 0 }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111', flexShrink: 0 }}>
              ChromaticDaily
            </span>
            <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0 }}>
              · chromatic-daily.lovable.app
            </span>
          </div>
      </div>
    </motion.div>
  );
}