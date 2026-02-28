import React from 'react';
import { CheckCircle2, XCircle, Loader2, SkipForward, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

const STATUS_ICON = {
  pending: <Clock className="h-4 w-4 text-zinc-500" />,
  running: <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  failed:  <XCircle className="h-4 w-4 text-red-400" />,
  skipped: <SkipForward className="h-4 w-4 text-zinc-500" />,
};

const STATUS_BORDER = {
  pending: 'border-zinc-700',
  running: 'border-violet-500/50',
  success: 'border-emerald-500/40',
  failed:  'border-red-500/40',
  skipped: 'border-zinc-700/50',
};

export default function WorkflowRunner({ stepResults = [], finalOutput, overallStatus }) {
  if (!stepResults.length) return null;

  return (
    <div className="space-y-3">
      {stepResults.map((r, i) => (
        <div key={r.step_id || i} className={`bg-zinc-800/40 border ${STATUS_BORDER[r.status]} rounded-xl p-3 space-y-2`}>
          <div className="flex items-center gap-2">
            {STATUS_ICON[r.status]}
            <span className="text-sm font-medium text-white">{r.name || `Step ${i + 1}`}</span>
            <span className={`ml-auto text-[10px] uppercase font-mono ${
              r.status === 'success' ? 'text-emerald-400' :
              r.status === 'failed'  ? 'text-red-400' :
              r.status === 'running' ? 'text-violet-400' :
              'text-zinc-500'
            }`}>{r.status}</span>
          </div>

          {r.error && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded px-2 py-1">{r.error}</p>
          )}

          {r.output && r.status === 'success' && (
            <div className="bg-zinc-900/60 rounded-lg px-3 py-2 max-h-40 overflow-y-auto">
              <ReactMarkdown className="text-xs text-zinc-300 prose prose-sm prose-invert max-w-none">
                {r.output.length > 600 ? r.output.slice(0, 600) + '…' : r.output}
              </ReactMarkdown>
            </div>
          )}
        </div>
      ))}

      {overallStatus && finalOutput && (
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Final Output</p>
          <ScrollArea className="max-h-60">
            <div className="bg-zinc-800/40 rounded-xl p-4">
              <ReactMarkdown className="text-sm text-zinc-200 prose prose-sm prose-invert max-w-none">
                {finalOutput}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}