import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ContextSuggestion({ 
  suggestion, 
  onAccept, 
  onDismiss,
  variant = 'default'
}) {
  if (!suggestion) return null;

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border animate-in slide-in-from-top-2",
      variant === 'epi' 
        ? "bg-violet-500/10 border-violet-500/30"
        : "bg-emerald-500/10 border-emerald-500/30"
    )}>
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
        variant === 'epi' ? "bg-violet-500/20" : "bg-emerald-500/20"
      )}>
        {variant === 'epi' ? (
          <Sparkles className="h-4 w-4 text-violet-400" />
        ) : (
          <Zap className="h-4 w-4 text-emerald-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium mb-1">
          {suggestion.title}
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {suggestion.description}
        </p>
        {suggestion.action && (
          <Button
            size="sm"
            onClick={() => onAccept(suggestion)}
            className={cn(
              "h-7 mt-2 text-xs",
              variant === 'epi'
                ? "bg-violet-600 hover:bg-violet-500"
                : "bg-emerald-600 hover:bg-emerald-500"
            )}
          >
            {suggestion.action}
          </Button>
        )}
      </div>

      <button
        onClick={() => onDismiss(suggestion.id)}
        className="text-zinc-500 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}