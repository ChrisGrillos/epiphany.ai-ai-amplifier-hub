import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const severityConfig = {
  low: { icon: Info, color: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
  medium: { icon: AlertCircle, color: 'bg-amber-500/10 border-amber-500/20 text-amber-300' },
  high: { icon: AlertCircle, color: 'bg-red-500/10 border-red-500/20 text-red-300' }
};

export default function EpiNudge({ nudge, onDismiss, onAction }) {
  if (!nudge) return null;

  const config = severityConfig[nudge.severity] || severityConfig.low;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "fixed bottom-6 right-6 max-w-sm rounded-lg border p-4 shadow-lg backdrop-blur-sm z-50",
          config.color
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Sparkles className="h-5 w-5 text-violet-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-white mb-1">Epi suggests</p>
              <p className="text-sm leading-relaxed">{nudge.message}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-6 w-6 text-zinc-500 hover:text-white shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {nudge.action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAction}
            className="mt-3 h-7 text-xs w-full hover:bg-white/10"
          >
            {nudge.actionLabel || 'Take action'}
          </Button>
        )}
        <p className="text-[10px] text-zinc-500 mt-2">
          Prepared by Epi • Level 4
        </p>
      </motion.div>
    </AnimatePresence>
  );
}