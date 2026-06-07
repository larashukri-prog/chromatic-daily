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
        wins: String(stats.totalCorrect),
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
      const caption = `My Chromatic Practice Stats ⚡️\nRounds: ${stats.roundsPlayed} · Consistency: ${consistency}% · Wins: ${stats.totalCorrect}\n\nhttps://chromatic-daily.lovable.app`;

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
          <StatCard icon={Zap} label="Wins" value={stats.totalCorrect} />
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
  wins: string;
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
    padding: '28px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#111111',
    boxSizing: 'border-box',
  } as CSSStyleDeclaration);
  root.setAttribute('aria-hidden', 'true');

  const ICONS = {
    rounds: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    reflex: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    peak: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto;"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.964.734H5.818a1 1 0 0 1-.965-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>`,
    decoded: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto;"><path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/></svg>`,
  };

  const SERIF = `'Playfair Display', Georgia, 'Times New Roman', serif`;
  // Note: avoid flex `gap` — html-to-image rasterizes via foreignObject and
  // gap collapses when a child wraps, causing the label to slide under the value.
  // Use explicit margins + white-space:nowrap to keep rows from overlapping.
  const stat = (icon: string, value: string, label: string, valueSize = 22) => `
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:14px 10px;text-align:center;">
      <div style="margin-bottom:8px;line-height:0;">${icon}</div>
      <div style="font-family:${SERIF};font-weight:600;font-size:${valueSize}px;color:#111;line-height:1.15;margin-bottom:8px;white-space:nowrap;">${escapeHtml(value)}</div>
      <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6b7280;line-height:1.2;white-space:nowrap;">${escapeHtml(label)}</div>
    </div>`;

  root.innerHTML = `
    <div style="text-align:center;margin-bottom:18px;">
      <div style="font-family:${SERIF};font-size:24px;font-weight:700;letter-spacing:-0.01em;color:#111;margin-bottom:8px;">Practice Session Complete</div>
      <div style="font-size:12px;color:#6b7280;line-height:1.55;padding:0 12px;">${escapeHtml(data.insight)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px;">
      ${stat(ICONS.rounds, data.rounds, 'Rounds')}
      ${stat(ICONS.reflex, data.wins, 'Wins')}
      ${stat(ICONS.peak, data.peak, 'Peak', 16)}
      ${stat(ICONS.decoded, data.decoded, 'Decoded')}
    </div>
    <div style="text-align:center;padding-top:14px;border-top:1px solid #e5e7eb;white-space:nowrap;">
      <span style="font-family:${SERIF};font-weight:700;font-size:14px;color:#111;">ChromaticDaily</span>
      <span style="font-size:11px;color:#6b7280;margin-left:8px;">· chromatic-daily.lovable.app</span>
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
