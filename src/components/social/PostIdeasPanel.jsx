import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Lightbulb, Loader2, RefreshCw, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PostIdeasPanel({ vault, onUseIdea }) {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const hasVault = !!vault?.living_summary;

  const generateIdeas = async () => {
    if (!hasVault) {
      toast.error('No vault summary available — open a vault first');
      return;
    }
    setLoading(true);
    setIdeas([]);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a creative social media strategist. Based on the following vault knowledge summary, generate 5 engaging social media post ideas.

Vault Summary:
${vault.living_summary.slice(0, 2000)}

For each idea provide:
- title: a short punchy hook (max 10 words)
- premise: 1-2 sentences explaining the post angle
- content_type: one of "Insight", "Story", "Question", "How-to", "Opinion", "Stat", "Behind-the-scenes"
- suggested_tone: one word tone (e.g. "Inspiring", "Educational", "Witty")

Return 5 diverse, creative ideas that would perform well on social media.`,
        response_json_schema: {
          type: 'object',
          properties: {
            ideas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  premise: { type: 'string' },
                  content_type: { type: 'string' },
                  suggested_tone: { type: 'string' },
                }
              }
            }
          }
        }
      });
      setIdeas(result.ideas || []);
      setExpanded(true);
    } catch {
      toast.error('Failed to generate ideas');
    }
    setLoading(false);
  };

  const TYPE_COLORS = {
    Insight: 'text-violet-400 bg-violet-500/10',
    Story: 'text-amber-400 bg-amber-500/10',
    Question: 'text-cyan-400 bg-cyan-500/10',
    'How-to': 'text-emerald-400 bg-emerald-500/10',
    Opinion: 'text-rose-400 bg-rose-500/10',
    Stat: 'text-blue-400 bg-blue-500/10',
    'Behind-the-scenes': 'text-orange-400 bg-orange-500/10',
  };

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
        >
          <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
          Post Ideas from Vault
          {ideas.length > 0 && (
            <span className="text-[9px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full">{ideas.length}</span>
          )}
          {expanded ? <ChevronUp className="h-3 w-3 text-zinc-600" /> : <ChevronDown className="h-3 w-3 text-zinc-600" />}
        </button>
        <button
          onClick={generateIdeas}
          disabled={loading || !hasVault}
          className={cn(
            'flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-colors',
            hasVault
              ? 'text-zinc-400 hover:text-white hover:bg-zinc-700'
              : 'text-zinc-600 cursor-not-allowed'
          )}
          title={!hasVault ? 'Open a vault with a living summary first' : ''}
        >
          {loading
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <RefreshCw className="h-3 w-3" />
          }
          {ideas.length > 0 ? 'Refresh' : 'Generate'}
        </button>
      </div>

      {/* Ideas list */}
      {expanded && (
        <div className="border-t border-zinc-700/50">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-4 text-xs text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
              Epi is reading your vault…
            </div>
          )}

          {!loading && ideas.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-zinc-600">
                {hasVault
                  ? 'Click "Generate" to get AI-powered post ideas from your vault content.'
                  : 'Open a vault to enable vault-inspired post ideas.'}
              </p>
            </div>
          )}

          {!loading && ideas.length > 0 && (
            <div className="divide-y divide-zinc-700/40">
              {ideas.map((idea, i) => {
                const typeColor = TYPE_COLORS[idea.content_type] || 'text-zinc-400 bg-zinc-700';
                return (
                  <div
                    key={i}
                    className="group flex items-start gap-3 px-3 py-2.5 hover:bg-zinc-700/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium', typeColor)}>
                          {idea.content_type}
                        </span>
                        <span className="text-[9px] text-zinc-600">{idea.suggested_tone}</span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-200 leading-snug">{idea.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{idea.premise}</p>
                    </div>
                    <button
                      onClick={() => onUseIdea(idea)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-all bg-violet-500/10 px-2 py-1 rounded-lg"
                    >
                      Use <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}