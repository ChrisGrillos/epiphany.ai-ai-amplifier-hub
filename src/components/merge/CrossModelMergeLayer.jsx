import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitMerge, Plus, Trash2, Loader2, Copy, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const MODEL_COLORS = [
  { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300' },
  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
];

const DEFAULT_MODELS = [
  { id: '1', name: 'Grok', transcript: '' },
  { id: '2', name: 'ChatGPT', transcript: '' },
];

export default function CrossModelMergeLayer({ open, onOpenChange }) {
  const [models, setModels] = useState(DEFAULT_MODELS);
  const [mergeResult, setMergeResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingName, setEditingName] = useState(null);

  const addModel = () => {
    const names = ['Claude', 'Gemini', 'Mistral', 'Llama', 'DeepSeek', 'Custom'];
    const usedNames = models.map(m => m.name);
    const next = names.find(n => !usedNames.includes(n)) || `Model ${models.length + 1}`;
    setModels(prev => [...prev, { id: Date.now().toString(), name: next, transcript: '' }]);
  };

  const removeModel = (id) => {
    if (models.length <= 2) { toast.error('Need at least 2 models to merge'); return; }
    setModels(prev => prev.filter(m => m.id !== id));
  };

  const updateTranscript = (id, transcript) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, transcript } : m));
  };

  const updateName = (id, name) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, name } : m));
    setEditingName(null);
  };

  const filledModels = models.filter(m => m.transcript.trim().length > 0);

  const handleAnalyze = async () => {
    if (filledModels.length < 2) {
      toast.error('Paste transcripts from at least 2 AI sessions to merge');
      return;
    }

    setIsAnalyzing(true);
    setMergeResult(null);

    const transcriptBlock = filledModels.map(m =>
      `=== ${m.name} SESSION ===\n${m.transcript.trim()}`
    ).join('\n\n');

    const prompt = `You are a cross-model synthesis engine. You have received session transcripts from ${filledModels.length} different AI assistants working on (possibly) the same topic or related topics.

Your job:
1. DETECT CONTRADICTIONS — identify where models gave conflicting answers, different facts, or incompatible recommendations. Be specific.
2. DETECT CONVERGENT INSIGHTS — identify where models independently reached the same conclusions (these are high-confidence findings).
3. SURFACE UNIQUE CONTRIBUTIONS — what did each model uniquely add that others missed?
4. PRODUCE A CROSS-MODEL SUMMARY — a brief, dense synthesis of the best of all sessions.

Format your response as valid markdown with these exact sections:
## ⚠️ Contradictions
(list each contradiction as: **Topic**: Model A says X, Model B says Y. Risk level: low/medium/high)

## ✅ Convergent Insights
(list points all models agreed on — these are high confidence)

## 💡 Unique Contributions
(per model: what only they surfaced)

## 🔀 Cross-Model Summary
(the merged best-answer synthesis, token-efficient, copy-pasteable)

---
🔑 HANDOFF BLOCK
Consensus: [1 sentence]
Contradictions to resolve: [bullets, max 3]
High-confidence findings: [bullets, max 5]
Recommended next step: [1 sentence]
---

TRANSCRIPTS:
${transcriptBlock}`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      const text = response.text || response.output || response.response || String(response);
      setMergeResult(text);
    } catch (err) {
      toast.error('Merge analysis failed');
    }

    setIsAnalyzing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[620px] sm:max-w-[620px] bg-zinc-900 border-zinc-800 p-0 flex flex-col">
        <SheetHeader className="p-4 pb-3 border-b border-zinc-800 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-white">
            <GitMerge className="h-4 w-4 text-violet-400" />
            Cross-Model Merge Layer
          </SheetTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Paste active session transcripts from multiple AI chats. Detect contradictions, find convergent insights, and get a unified synthesis.
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {/* Model Transcript Inputs */}
            {models.map((model, idx) => {
              const color = MODEL_COLORS[idx % MODEL_COLORS.length];
              return (
                <div key={model.id} className={cn('rounded-xl border p-3', color.bg, color.border)}>
                  <div className="flex items-center gap-2 mb-2">
                    {editingName === model.id ? (
                      <input
                        autoFocus
                        defaultValue={model.name}
                        onBlur={(e) => updateName(model.id, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') updateName(model.id, e.target.value); }}
                        className="text-sm font-medium bg-transparent border-b border-zinc-500 text-white outline-none w-32"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingName(model.id)}
                        className={cn('text-sm font-semibold hover:underline', color.text)}
                      >
                        {model.name}
                      </button>
                    )}
                    <span className="text-[10px] text-zinc-600">click name to rename</span>
                    <div className="ml-auto flex items-center gap-1">
                      {model.transcript.trim() && (
                        <Badge className={cn('text-[10px]', color.badge)}>
                          ~{Math.round(model.transcript.trim().split(/\s+/).length / 0.75)} tokens
                        </Badge>
                      )}
                      <button
                        onClick={() => removeModel(model.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <Textarea
                    value={model.transcript}
                    onChange={(e) => updateTranscript(model.id, e.target.value)}
                    placeholder={`Paste ${model.name} session transcript here…`}
                    className="min-h-[100px] bg-zinc-900/60 border-zinc-700/50 text-zinc-300 text-xs resize-none"
                  />
                </div>
              );
            })}

            {/* Add model */}
            <button
              onClick={addModel}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Add another model session
            </button>

            {/* Analyze */}
            <Button
              onClick={handleAnalyze}
              disabled={filledModels.length < 2 || isAnalyzing}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white h-11"
            >
              {isAnalyzing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing across models…</>
              ) : (
                <><GitMerge className="h-4 w-4 mr-2" /> Merge & Analyze ({filledModels.length} sessions)</>
              )}
            </Button>

            {/* Result */}
            {mergeResult && (
              <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <GitMerge className="h-4 w-4 text-violet-400" />
                    Merge Report
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { navigator.clipboard.writeText(mergeResult); toast.success('Copied merge report'); }}
                    className="h-7 px-2 text-zinc-500 hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                </div>
                <ReactMarkdown
                  className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 text-zinc-300"
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-sm font-semibold text-white mt-4 mb-2 flex items-center gap-1">{children}</h2>
                    ),
                    hr: () => <hr className="border-zinc-700 my-3" />,
                    p: ({ children }) => <p className="my-1 text-xs leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="my-1 ml-4 list-disc space-y-1">{children}</ul>,
                    li: ({ children }) => <li className="text-xs text-zinc-400">{children}</li>,
                    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-violet-500/50 pl-3 my-2 text-zinc-400 italic text-xs">{children}</blockquote>
                    ),
                  }}
                >
                  {mergeResult}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}