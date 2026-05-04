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
    if (isCapturing) return;
    setIsCapturing(true);
    let tempNode: HTMLDivElement | null = null;
    try {
      // Build an isolated, visible-to-the-renderer share card with inline
      // styles + system fonts so html-to-image doesn't trip on cross-origin
      // Google Fonts stylesheets and the node is fully painted.
      tempNode = buildShareCardNode({
        insight: getInsight(stats),
        rounds: String(stats.roundsPlayed),
        reflex: reflexLabel,
        peak: peakLabel,
        decoded: String(stats.tilesDecoded),
      });
      document.body.appendChild(tempNode);

      // Wait for fonts + two paint cycles before rasterizing.
      try { await (document as any).fonts?.ready; } catch {}
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      const rect = tempNode.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        throw new Error('Capture node has zero size');
      }

      const dataUrl = await htmlToImage.toPng(tempNode, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
        skipFonts: true,
        width: tempNode.offsetWidth,
        height: tempNode.offsetHeight,
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
      if (tempNode && tempNode.parentNode) tempNode.parentNode.removeChild(tempNode);
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
    </motion.div>
  );
}

/**
 * Build a self-contained, inline-styled DOM card for PNG capture.
 * Avoids React/lucide/Google-Fonts dependencies so html-to-image
 * never produces a blank rasterization.
 */
function buildShareCardNode(data: {
  insight: string;
  rounds: string;
  reflex: string;
  peak: string;
  decoded: string;
}): HTMLDivElement {
  const root = document.createElement('div');
  Object.assign(root.style, {
    position: 'fixed',
    left: '0px',
    top: '0px',
    zIndex: '-1',
    pointerEvents: 'none',
    width: '420px',
    padding: '24px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#111111',
    boxSizing: 'border-box',
  } as CSSStyleDeclaration);
  root.setAttribute('aria-hidden', 'true');

  root.innerHTML = `
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:22px;font-weight:700;margin-bottom:6px;color:#111;">Practice Session Complete</div>
      <div style="font-size:12px;color:#6b7280;line-height:1.5;">${escapeHtml(data.insight)}</div>
    </div>
    ${[
      ['Rounds', data.rounds],
      ['Reflex Avg', data.reflex],
      ['Peak', data.peak],
      ['Decoded', data.decoded],
    ]
      .map(
        ([label, value]) => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:8px;">
        <span style="flex-shrink:0;font-weight:600;font-size:18px;color:#111;min-width:64px;">${escapeHtml(value)}</span>
        <span style="flex-shrink:0;margin-left:auto;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6b7280;">${escapeHtml(label)}</span>
      </div>`,
      )
      .join('')}
    <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;">
      <span style="font-weight:700;font-size:14px;color:#111;flex-shrink:0;">ChromaticDaily</span>
      <span style="font-size:11px;color:#6b7280;flex-shrink:0;">· chromatic-daily.lovable.app</span>
    </div>
  `;
  return root;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}