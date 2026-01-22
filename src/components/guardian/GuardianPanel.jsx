import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  AlertTriangle, 
  Info,
  CheckCircle2,
  Copy,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const severityConfig = {
  low: { 
    icon: Info, 
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    badge: 'bg-blue-500/20 text-blue-300'
  },
  medium: { 
    icon: AlertTriangle, 
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-300'
  },
  high: { 
    icon: AlertTriangle, 
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    badge: 'bg-red-500/20 text-red-300'
  },
};

const typeLabels = {
  contradiction: 'Contradiction',
  stale_action: 'Stale Action',
  missing_link: 'Missing Link',
  uncertainty: 'Uncertainty',
  risk: 'Risk',
};

export default function GuardianPanel({ 
  open, 
  onOpenChange,
  notes = [],
  isLoading,
  onCheckNow,
  onDismissNote,
  vaultName 
}) {
  const hasNotes = notes && notes.length > 0;

  const copySuggestion = (note) => {
    navigator.clipboard.writeText(note.suggested_change || '');
    toast.success('Suggestion copied');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[450px] sm:max-w-[450px] bg-zinc-900 border-zinc-800 p-0">
        <SheetHeader className="p-6 pb-4 border-b border-zinc-800">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Vault Guardian
          </SheetTitle>
          <p className="text-xs text-zinc-500 mt-1">{vaultName}</p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-6 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-violet-400 animate-spin mb-4" />
                <p className="text-sm text-zinc-400">Running Guardian analysis...</p>
              </div>
            ) : !hasNotes ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                <p className="text-sm text-zinc-400">All clear! No issues detected.</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Your Living Summary looks healthy.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">
                    {notes.length} {notes.length === 1 ? 'Note' : 'Notes'}
                  </p>
                </div>

                <div className="space-y-3">
                  {notes.map((note, idx) => {
                    const severity = severityConfig[note.severity] || severityConfig.low;
                    const Icon = severity.icon;

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "rounded-lg border p-4 space-y-3",
                          severity.color
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1">
                            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-white">
                                  {note.title}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={cn("text-xs", severity.badge)}>
                                  {typeLabels[note.type] || note.type}
                                </Badge>
                                {note.target_section && (
                                  <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                                    {note.target_section}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-zinc-300 leading-relaxed">
                                {note.detail}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDismissNote?.(idx)}
                            className="h-6 w-6 text-zinc-500 hover:text-white shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {note.suggested_change && (
                          <div className="bg-zinc-900/50 rounded p-3 space-y-2">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider">
                              Suggested Change
                            </p>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              {note.suggested_change}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copySuggestion(note)}
                              className="h-7 text-xs text-zinc-400 hover:text-white"
                            >
                              <Copy className="h-3 w-3 mr-1.5" />
                              Copy Suggestion
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-zinc-800">
          <Button
            variant="outline"
            onClick={onCheckNow}
            disabled={isLoading}
            className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Run Guardian Check
              </>
            )}
          </Button>
          <p className="text-[10px] text-zinc-600 text-center mt-2">
            Checks for contradictions, stale actions, and conflicts
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}