import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, CheckCircle2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ONBOARDING_KEY = 'hueday_onboarded';

const steps: { icon: typeof Eye; label: string; desc: string }[] = [
  { icon: Eye, label: 'Analyze the Colors', desc: 'Take your time studying the color shades shown to you.' },
  { icon: CheckCircle2, label: 'Start the Challenge', desc: "Tap the 'I am Ready' button once you've memorized the colors. The target colors will disappear once pressed." },
  { icon: Star, label: 'Earn a Speed Star ⭐️', desc: "If you hit 'Ready' fast, you'll earn a Speed Star when you win the round!" },
];

export function useOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
  };

  return { show, dismiss };
}

export function OnboardingOverlay({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', backgroundColor: 'hsla(0, 0%, 98%, 0.75)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8"
          >
            <h2
              className="text-2xl text-center mb-1"
              style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontWeight: 700 }}
            >
              How to Play
            </h2>
            <p className="text-xs text-center text-muted-foreground uppercase tracking-widest mb-6">
              Study. Memorize. Match.
            </p>

            <div className="space-y-4">
              {steps.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                  className="flex items-start gap-3"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center mt-0.5">
                    <step.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button
              onClick={onDismiss}
              className="w-full mt-8 rounded-xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-sm tracking-wide"
            >
              Got it
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
