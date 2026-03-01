import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users, Plus, X, Loader2, Twitter, Linkedin, Instagram,
  TrendingUp, TrendingDown, Minus, BarChart2, Lightbulb,
  RefreshCw, AlertCircle, Hash, Clock, Heart
} from 'lucide-react';
import { toast } from 'sonner';

const PLATFORM_META = {
  twitter:   { label: 'X / Twitter', Icon: Twitter,   color: 'text-sky-400',  bg: 'bg-sky-500/10',   border: 'border-sky-500/30' },
  linkedin:  { label: 'LinkedIn',    Icon: Linkedin,   color: 'text-blue-400', bg: 'bg-blue-500/10',  border: 'border-blue-500/30' },
  instagram: { label: 'Instagram',   Icon: Instagram,  color: 'text-pink-400', bg: 'bg-pink-500/10',  border: 'border-pink-500/30' },
};

function DeltaBadge({ value }) {
  if (value === null || value === undefined) return null;
  const positive = value >= 0;
  const Icon = value > 5 ? TrendingUp : value < -5 ? TrendingDown : Minus;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded',
      positive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
    )}>
      <Icon className="h-2.5 w-2.5" />
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function CompetitorCard({ competitor, onRemove, userAvgEngagement }) {
  const meta = PLATFORM_META[competitor.platform] || PLATFORM_META.twitter;
  const { Icon, color, bg, border } = meta;

  const engDelta = userAvgEngagement && competitor.engagement_rate
    ? ((userAvgEngagement - competitor.engagement_rate) / competitor.engagement_rate) * 100
    : null;

  return (
    <div className={cn('rounded-xl border p-3 space-y-3', bg, border)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', color)} />
          <span className={cn('text-sm font-semibold', color)}>@{competitor.handle}</span>
          <Badge className={cn('text-[9px] px-1.5', bg, 'border-0', color)}>
            {meta.label}
          </Badge>
        </div>
        <button onClick={() => onRemove(competitor.handle)} className="text-zinc-600 hover:text-red-400 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-black/20 rounded-lg px-2 py-1.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Heart className="h-2.5 w-2.5 text-rose-400" />
          </div>
          <p className="text-sm font-bold text-white">{competitor.engagement_rate?.toFixed(2)}%</p>
          <p className="text-[9px] text-zinc-500">Eng. Rate</p>
        </div>
        <div className="bg-black/20 rounded-lg px-2 py-1.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Clock className="h-2.5 w-2.5 text-violet-400" />
          </div>
          <p className="text-sm font-bold text-white">{competitor.posts_per_week}x</p>
          <p className="text-[9px] text-zinc-500">Posts/week</p>
        </div>
        <div className="bg-black/20 rounded-lg px-2 py-1.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Users className="h-2.5 w-2.5 text-cyan-400" />
          </div>
          <p className="text-sm font-bold text-white">{competitor.estimated_followers}</p>
          <p className="text-[9px] text-zinc-500">Followers (est.)</p>
        </div>
      </div>

      {/* vs your avg */}
      {engDelta !== null && (
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span>vs. your avg:</span>
          <DeltaBadge value={engDelta} />
          <span className="text-zinc-600">{engDelta >= 0 ? 'you\'re ahead' : 'they\'re ahead'}</span>
        </div>
      )}

      {/* Top content types */}
      {competitor.top_content_types?.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500 flex items-center gap-1">
            <BarChart2 className="h-3 w-3" /> Top content types:
          </p>
          <div className="flex flex-wrap gap-1">
            {competitor.top_content_types.map((ct, i) => (
              <span key={i} className={cn('text-[10px] px-1.5 py-0.5 rounded bg-black/20', color)}>
                {ct}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top hashtags */}
      {competitor.top_hashtags?.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Hash className="h-3 w-3" /> Popular hashtags:
          </p>
          <div className="flex flex-wrap gap-1">
            {competitor.top_hashtags.map((h, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                #{h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strategic insight */}
      {competitor.strategic_insight && (
        <div className="flex gap-2 rounded-lg bg-black/20 px-2.5 py-2 text-[10px] text-zinc-300 leading-relaxed">
          <Lightbulb className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
          {competitor.strategic_insight}
        </div>
      )}

      {competitor.data_note && (
        <p className="text-[9px] text-zinc-700 italic">{competitor.data_note}</p>
      )}
    </div>
  );
}

export default function CompetitorAnalysis({ userAvgEngagement }) {
  const [handles, setHandles] = useState([]); // { handle, platform }
  const [inputHandle, setInputHandle] = useState('');
  const [inputPlatform, setInputPlatform] = useState('twitter');
  const [competitors, setCompetitors] = useState({}); // handle -> data
  const [loading, setLoading] = useState({}); // handle -> bool

  const addHandle = () => {
    const clean = inputHandle.trim().replace(/^@/, '');
    if (!clean) return;
    if (handles.find(h => h.handle === clean && h.platform === inputPlatform)) {
      toast.info('Already tracking this handle');
      return;
    }
    setHandles(prev => [...prev, { handle: clean, platform: inputPlatform }]);
    setInputHandle('');
    fetchCompetitor(clean, inputPlatform);
  };

  const removeHandle = (handle) => {
    setHandles(prev => prev.filter(h => h.handle !== handle));
    setCompetitors(prev => { const n = { ...prev }; delete n[handle]; return n; });
  };

  const fetchCompetitor = async (handle, platform) => {
    setLoading(prev => ({ ...prev, [handle]: true }));
    try {
      const platformLabel = PLATFORM_META[platform]?.label || platform;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a social media analyst. Research the ${platformLabel} account "@${handle}" and provide estimated performance data based on publicly available information.

Return a JSON object with these fields:
- engagement_rate: number (estimated % engagement rate, e.g. 2.5)
- posts_per_week: number (estimated posting frequency per week)
- estimated_followers: string (e.g. "12.4K", "1.2M")
- top_content_types: array of 3-4 strings (e.g. ["How-to threads", "Industry news", "Product announcements"])
- top_hashtags: array of 4-6 commonly used hashtags (without the # symbol)
- strategic_insight: string (1-2 sentence insight on what makes their content strategy work or what gaps exist)
- data_note: string (brief note like "Estimates based on web research as of early 2026")

Be realistic and data-informed. If this is a well-known brand, use your knowledge. If unknown, provide reasonable estimates for a ${platformLabel} account in their apparent industry.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            engagement_rate: { type: 'number' },
            posts_per_week: { type: 'number' },
            estimated_followers: { type: 'string' },
            top_content_types: { type: 'array', items: { type: 'string' } },
            top_hashtags: { type: 'array', items: { type: 'string' } },
            strategic_insight: { type: 'string' },
            data_note: { type: 'string' },
          }
        }
      });
      setCompetitors(prev => ({ ...prev, [handle]: { ...result, handle, platform } }));
    } catch {
      toast.error(`Failed to fetch data for @${handle}`);
      setHandles(prev => prev.filter(h => h.handle !== handle));
    }
    setLoading(prev => ({ ...prev, [handle]: false }));
  };

  const refreshAll = () => {
    handles.forEach(({ handle, platform }) => fetchCompetitor(handle, platform));
  };

  return (
    <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-violet-400" /> Competitor Analysis
          <span className="text-[10px] text-zinc-500 font-normal">AI-powered estimates</span>
        </p>
        {handles.length > 0 && (
          <button onClick={refreshAll} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Add handle */}
      <div className="flex gap-2">
        <div className="flex gap-1">
          {Object.entries(PLATFORM_META).map(([pid, meta]) => {
            const Icon = meta.Icon;
            return (
              <button
                key={pid}
                onClick={() => setInputPlatform(pid)}
                title={meta.label}
                className={cn(
                  'p-1.5 rounded-lg border transition-colors',
                  inputPlatform === pid
                    ? cn(meta.bg, meta.border, meta.color)
                    : 'border-zinc-700 text-zinc-600 hover:text-zinc-400'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
        <Input
          value={inputHandle}
          onChange={e => setInputHandle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addHandle()}
          placeholder="competitor_handle"
          className="flex-1 h-8 bg-zinc-800 border-zinc-700 text-white text-xs placeholder:text-zinc-600"
        />
        <Button onClick={addHandle} size="sm" className="h-8 px-3 bg-violet-600 hover:bg-violet-500">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Competitor cards */}
      {handles.length === 0 && (
        <div className="text-center py-6 text-zinc-600">
          <Users className="h-6 w-6 mx-auto mb-2 opacity-40" />
          <p className="text-xs">Add competitor handles above to analyze their strategy.</p>
        </div>
      )}

      <div className="space-y-3">
        {handles.map(({ handle, platform }) => {
          const data = competitors[handle];
          const isLoading = loading[handle];

          if (isLoading) {
            return (
              <div key={handle} className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-4 flex items-center gap-3">
                <Loader2 className="h-4 w-4 text-violet-400 animate-spin shrink-0" />
                <div>
                  <p className="text-xs text-zinc-300">Researching @{handle}…</p>
                  <p className="text-[10px] text-zinc-600">Using AI + web search</p>
                </div>
              </div>
            );
          }

          if (!data) return null;

          return (
            <CompetitorCard
              key={handle}
              competitor={data}
              onRemove={removeHandle}
              userAvgEngagement={userAvgEngagement}
            />
          );
        })}
      </div>

      {handles.length > 0 && (
        <p className="text-[9px] text-zinc-700 flex items-center gap-1">
          <AlertCircle className="h-2.5 w-2.5" />
          Data is AI-estimated using web search. Not sourced from official platform APIs.
        </p>
      )}
    </div>
  );
}