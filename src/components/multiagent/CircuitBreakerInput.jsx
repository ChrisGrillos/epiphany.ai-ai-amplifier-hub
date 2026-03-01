import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_BREAKS = [
  { label: 'Reframe', prompt: 'Step back entirely. What if the core premise of this discussion is wrong? Start fresh from a completely different angle.' },
  { label: 'Simplify', prompt: 'Ignore everything said so far. What is the simplest possible answer to the original question?' },
  { label: 'Concrete', prompt: 'Stop theorizing. Give one specific, concrete, real-world example that would resolve this debate.' },
  { label: 'Opposing View', prompt: 'What would someone who completely disagrees with all current positions say? Make the strongest possible opposing case.' },
];

export default function CircuitBreakerInput({ onInject, disabled }) {
  const [expanded, setExpanded] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  const handleInject = (msg) => {
    if (!msg.trim()) return;
    onInject(msg.trim());
    setCustomMsg('');
  };

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        disabled={disabled}
      >
        <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span className="text-xs font-medium text-amber-300">Manual Circuit Breaker</span>
        <span className="text-[10px] text-zinc-600 ml-1">Interrupt & redirect agents</span>
        <div className="ml-auto text-zinc-600">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-amber-500/20">
          {/* Quick break buttons */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {QUICK_BREAKS.map(qb => (
              <button
                key={qb.label}
                onClick={() => handleInject(qb.prompt)}
                disabled={disabled}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-40"
              >
                ⚡ {qb.label}
              </button>
            ))}
          </div>

          {/* Custom message */}
          <div className="flex gap-2">
            <Textarea
              value={customMsg}
              onChange={e => setCustomMsg(e.target.value)}
              placeholder="Custom redirect message for the agents…"
              className="bg-zinc-900 border-amber-500/20 text-zinc-200 text-xs resize-none min-h-[60px] placeholder:text-zinc-600"
              disabled={disabled}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleInject(customMsg);
              }}
            />
            <Button
              onClick={() => handleInject(customMsg)}
              disabled={disabled || !customMsg.trim()}
              size="sm"
              className="self-end bg-amber-600 hover:bg-amber-500 text-white h-8 px-3"
            >
              <Zap className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-[10px] text-zinc-600">⌘+Enter to inject</p>
        </div>
      )}
    </div>
  );
}