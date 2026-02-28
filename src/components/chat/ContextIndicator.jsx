import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FileText, MessageSquare, Cpu } from 'lucide-react';

/**
 * Visible context indicator strip — shows exactly what's loaded into each call.
 * token estimates are rough (4 chars ≈ 1 token).
 */
function estimateTokens(text = '') {
  return Math.ceil(text.length / 4);
}

export default function ContextIndicator({ vault, references = [], selectedIds = [], messages = [] }) {
  const summaryTokens = estimateTokens(vault?.living_summary);

  const attachedRefs = useMemo(
    () => references.filter(r => selectedIds.includes(r.id)),
    [references, selectedIds]
  );
  const refTokens = useMemo(
    () => attachedRefs.reduce((sum, r) => sum + estimateTokens(r.full_content || r.excerpt), 0),
    [attachedRefs]
  );

  const historyTokens = useMemo(
    () => messages.slice(-5).reduce((sum, m) => sum + estimateTokens(m.content), 0),
    [messages]
  );

  const total = summaryTokens + refTokens + historyTokens;
  const MAX = 80000;
  const pct = Math.min(100, Math.round((total / MAX) * 100));

  const barColor =
    pct > 80 ? 'bg-red-500' :
    pct > 55 ? 'bg-yellow-500' :
    'bg-emerald-500';

  if (!vault) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-1.5 bg-zinc-900/60 border-b border-zinc-800/50 text-[11px] text-zinc-400 select-none overflow-x-auto"
      >
        {/* Summary */}
        <span className="flex items-center gap-1 shrink-0">
          <BookOpen className="h-3 w-3 text-violet-400" />
          <span className="text-zinc-300">Summary</span>
          <span className="text-violet-400">✓</span>
          <span className="text-zinc-600">{summaryTokens.toLocaleString()} tok</span>
        </span>

        <span className="text-zinc-700">·</span>

        {/* References */}
        <span className="flex items-center gap-1 shrink-0">
          <FileText className="h-3 w-3 text-blue-400" />
          {attachedRefs.length > 0 ? (
            <>
              <span className="text-zinc-300">{attachedRefs.length} file{attachedRefs.length > 1 ? 's' : ''}</span>
              <span className="text-blue-400">✓</span>
              <span className="text-zinc-600">{refTokens.toLocaleString()} tok</span>
            </>
          ) : (
            <span className="text-zinc-600">No files attached</span>
          )}
        </span>

        <span className="text-zinc-700">·</span>

        {/* History */}
        <span className="flex items-center gap-1 shrink-0">
          <MessageSquare className="h-3 w-3 text-amber-400" />
          {messages.length > 0 ? (
            <>
              <span className="text-zinc-300">{Math.min(messages.length, 5)} recent msgs</span>
              <span className="text-amber-400">✓</span>
              <span className="text-zinc-600">{historyTokens.toLocaleString()} tok</span>
            </>
          ) : (
            <span className="text-zinc-600">No history</span>
          )}
        </span>

        {/* Total + bar */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Cpu className="h-3 w-3 text-zinc-500" />
          <span className="text-zinc-400">{total.toLocaleString()} / {(MAX / 1000).toFixed(0)}K tok</span>
          <div className="w-20 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {pct > 80 && (
            <span className="text-red-400 font-medium">Context full</span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}