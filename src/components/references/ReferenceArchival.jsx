import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Archive, Loader2, AlertCircle, FileText, Calendar, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReferenceArchival({ open, onOpenChange, vaultId, references, onArchiveComplete }) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    if (open && vaultId) {
      analyzeCandidates();
    }
  }, [open, vaultId]);

  const analyzeCandidates = async () => {
    setIsAnalyzing(true);
    try {
      // Analyze references for archival candidates
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these references for archival candidates. Return JSON array of candidates with scores:

References:
${references.map(r => `
- ID: ${r.id}
- File: ${r.filename} (${r.file_type})
- Last accessed: ${r.last_accessed || 'never'}
- Usage count: ${r.usage_count || 0}
- Uploaded: ${r.created_date}
`).join('\n')}

Criteria:
1. Not accessed in 30+ days
2. Low usage count (< 3)
3. Duplicate/redundant content
4. Outdated information

Return candidates with archival_score (0-100) and reason.`,
        response_json_schema: {
          type: "object",
          properties: {
            candidates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  reference_id: { type: "string" },
                  archival_score: { type: "number" },
                  reason: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            }
          }
        }
      });

      const candidates = (analysis.candidates || [])
        .filter(c => c.archival_score >= 60)
        .sort((a, b) => b.archival_score - a.archival_score);

      setSuggestions(candidates);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze references');
    }
    setIsAnalyzing(false);
  };

  const handleArchive = async () => {
    if (selectedIds.length === 0) return;

    setIsArchiving(true);
    try {
      for (const refId of selectedIds) {
        const suggestion = suggestions.find(s => s.reference_id === refId);
        await base44.entities.Reference.update(refId, {
          archived: true,
          archival_reason: suggestion?.reason || 'User archived'
        });
      }

      toast.success(`Archived ${selectedIds.length} references`);
      onArchiveComplete();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to archive references');
    }
    setIsArchiving(false);
  };

  const toggleSelection = (refId) => {
    setSelectedIds(prev =>
      prev.includes(refId) ? prev.filter(id => id !== refId) : [...prev, refId]
    );
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-yellow-400';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-violet-400" />
            Reference Archival Suggestions
          </SheetTitle>
          <SheetDescription className="text-zinc-400">
            Epi analyzed your references and found candidates for archival
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-6">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-8 w-8 text-violet-400 animate-spin mb-3" />
              <p className="text-sm text-zinc-400">Analyzing references...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="h-12 w-12 text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-400">No archival candidates found</p>
              <p className="text-xs text-zinc-500 mt-1">Your references are all actively used!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion) => {
                const ref = references.find(r => r.id === suggestion.reference_id);
                if (!ref) return null;

                return (
                  <div
                    key={suggestion.reference_id}
                    className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.includes(suggestion.reference_id)}
                        onCheckedChange={() => toggleSelection(suggestion.reference_id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-zinc-400" />
                            <span className="text-sm font-medium text-white">{ref.filename}</span>
                            <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                              {ref.file_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingDown className={`h-4 w-4 ${getScoreColor(suggestion.archival_score)}`} />
                            <span className={`text-sm font-semibold ${getScoreColor(suggestion.archival_score)}`}>
                              {suggestion.archival_score}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400">{suggestion.reason}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {ref.last_accessed ? (
                              <span>Last used {format(new Date(ref.last_accessed), 'MMM d')}</span>
                            ) : (
                              <span>Never used</span>
                            )}
                          </div>
                          <span>•</span>
                          <span>{ref.usage_count || 0} uses</span>
                        </div>

                        {suggestion.recommendation && (
                          <div className="bg-violet-500/10 border border-violet-500/30 rounded p-2">
                            <p className="text-xs text-violet-300">{suggestion.recommendation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">
            {selectedIds.length} of {suggestions.length} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleArchive}
              disabled={selectedIds.length === 0 || isArchiving}
              className="bg-violet-600 hover:bg-violet-500"
            >
              {isArchiving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Selected
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}