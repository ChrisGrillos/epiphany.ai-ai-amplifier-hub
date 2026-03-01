import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Twitter, Linkedin, Instagram, TrendingUp, TrendingDown, Minus, Lightbulb, Target, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from 'recharts';

// ─── Industry Benchmarks (sourced from publicly available 2023–2024 industry reports) ──

const INDUSTRY_BENCHMARKS = {
  twitter: {
    label: 'X / Twitter',
    Icon: Twitter,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    chartColor: '#38bdf8',
    engagement_rate: 0.5,   // %
    likes_per_post: 35,
    shares_per_post: 12,
    comments_per_post: 8,
    impressions_per_post: 3200,
    clicks_per_post: 45,
    source: 'Hootsuite 2024',
  },
  linkedin: {
    label: 'LinkedIn',
    Icon: Linkedin,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    chartColor: '#60a5fa',
    engagement_rate: 2.0,
    likes_per_post: 180,
    shares_per_post: 25,
    comments_per_post: 30,
    impressions_per_post: 5500,
    clicks_per_post: 120,
    source: 'LinkedIn Marketing 2024',
  },
  instagram: {
    label: 'Instagram',
    Icon: Instagram,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    chartColor: '#f472b6',
    engagement_rate: 3.5,
    likes_per_post: 260,
    shares_per_post: 40,
    comments_per_post: 20,
    impressions_per_post: 7800,
    clicks_per_post: 95,
    source: 'Sprout Social 2024',
  },
};

function engagementRate(post) {
  const a = post.analytics;
  if (!a || !a.impressions) return 0;
  return ((a.likes + a.shares + a.comments) / a.impressions) * 100;
}

function delta(yours, benchmark) {
  if (!benchmark) return null;
  return ((yours - benchmark) / benchmark) * 100;
}

function DeltaBadge({ value }) {
  if (value === null) return null;
  const positive = value >= 0;
  const Icon = value > 2 ? TrendingUp : value < -2 ? TrendingDown : Minus;
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

// ─── Per-platform benchmark row ───────────────────────────────────────────────

function PlatformBenchmark({ pid, posts }) {
  const bench = INDUSTRY_BENCHMARKS[pid];
  const published = posts.filter(p => p.platform === pid && p.status === 'published' && p.analytics);
  const [expanded, setExpanded] = useState(false);

  if (!bench || !published.length) return null;

  const n = published.length;
  const avgEng = published.reduce((s, p) => s + engagementRate(p), 0) / n;
  const avgLikes = published.reduce((s, p) => s + (p.analytics?.likes ?? 0), 0) / n;
  const avgShares = published.reduce((s, p) => s + (p.analytics?.shares ?? 0), 0) / n;
  const avgComments = published.reduce((s, p) => s + (p.analytics?.comments ?? 0), 0) / n;
  const avgImpressions = published.reduce((s, p) => s + (p.analytics?.impressions ?? 0), 0) / n;
  const avgClicks = published.reduce((s, p) => s + (p.analytics?.clicks ?? 0), 0) / n;

  const Icon = bench.Icon;
  const engDelta = delta(avgEng, bench.engagement_rate);

  const rows = [
    { label: 'Engagement Rate', yours: `${avgEng.toFixed(2)}%`, benchmark: `${bench.engagement_rate}%`, d: engDelta },
    { label: 'Avg Likes',       yours: Math.round(avgLikes).toLocaleString(),       benchmark: bench.likes_per_post.toLocaleString(),       d: delta(avgLikes, bench.likes_per_post) },
    { label: 'Avg Shares',      yours: Math.round(avgShares).toLocaleString(),      benchmark: bench.shares_per_post.toLocaleString(),      d: delta(avgShares, bench.shares_per_post) },
    { label: 'Avg Comments',    yours: Math.round(avgComments).toLocaleString(),    benchmark: bench.comments_per_post.toLocaleString(),    d: delta(avgComments, bench.comments_per_post) },
    { label: 'Avg Impressions', yours: Math.round(avgImpressions).toLocaleString(), benchmark: bench.impressions_per_post.toLocaleString(), d: delta(avgImpressions, bench.impressions_per_post) },
    { label: 'Avg Clicks',      yours: Math.round(avgClicks).toLocaleString(),      benchmark: bench.clicks_per_post.toLocaleString(),      d: delta(avgClicks, bench.clicks_per_post) },
  ];

  const radarData = [
    { metric: 'Eng.Rate', yours: Math.min((avgEng / bench.engagement_rate) * 100, 200), bench: 100 },
    { metric: 'Likes',    yours: Math.min((avgLikes / bench.likes_per_post) * 100, 200), bench: 100 },
    { metric: 'Shares',   yours: Math.min((avgShares / bench.shares_per_post) * 100, 200), bench: 100 },
    { metric: 'Comments', yours: Math.min((avgComments / bench.comments_per_post) * 100, 200), bench: 100 },
    { metric: 'Clicks',   yours: Math.min((avgClicks / bench.clicks_per_post) * 100, 200), bench: 100 },
  ];

  return (
    <div className={cn('rounded-xl border p-3 space-y-2', bench.bg, bench.border)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', bench.color)} />
          <span className={cn('text-xs font-semibold', bench.color)}>{bench.label}</span>
          <span className="text-[9px] text-zinc-600">{n} post{n !== 1 ? 's' : ''} · vs. industry avg</span>
          <DeltaBadge value={engDelta} />
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-600" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />}
      </button>

      {/* Score bar — always visible */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-zinc-600 w-24 shrink-0">vs. benchmark</span>
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, (avgEng / bench.engagement_rate) * 100)}%`,
              background: bench.chartColor,
              opacity: 0.8,
            }}
          />
        </div>
        <span className={cn('text-[9px] font-semibold', bench.color)}>
          {((avgEng / bench.engagement_rate) * 100).toFixed(0)}%
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="pt-2 space-y-3">
          {/* Radar */}
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={radarData} margin={{ top: 0, right: 16, bottom: 0, left: 16 }}>
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#71717a', fontSize: 10 }} />
              <Radar name="Industry Avg" dataKey="bench" stroke="#52525b" fill="#52525b" fillOpacity={0.15} />
              <Radar name="Yours" dataKey="yours" stroke={bench.chartColor} fill={bench.chartColor} fillOpacity={0.25} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-[10px]">
                      <p className="text-zinc-400 mb-0.5">{label}</p>
                      {payload.map((p, i) => (
                        <div key={i} style={{ color: p.color }}>{p.name}: {Math.round(p.value)}%</div>
                      ))}
                    </div>
                  );
                }}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Table */}
          <div className="divide-y divide-zinc-800">
            <div className="flex items-center gap-2 pb-1 text-[9px] text-zinc-600 font-medium uppercase">
              <span className="flex-1">Metric</span>
              <span className="w-16 text-right">Yours</span>
              <span className="w-16 text-right">Industry</span>
              <span className="w-16 text-right">Delta</span>
            </div>
            {rows.map(r => (
              <div key={r.label} className="flex items-center gap-2 py-1">
                <span className="flex-1 text-[10px] text-zinc-400">{r.label}</span>
                <span className="w-16 text-right text-[10px] text-white font-medium">{r.yours}</span>
                <span className="w-16 text-right text-[10px] text-zinc-500">{r.benchmark}</span>
                <div className="w-16 flex justify-end"><DeltaBadge value={r.d} /></div>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-zinc-700">Source: {bench.source}</p>
        </div>
      )}
    </div>
  );
}

// ─── Historical Best Comparison ───────────────────────────────────────────────

function HistoricalBest({ posts }) {
  const published = posts.filter(p => p.status === 'published' && p.analytics);
  if (published.length < 3) return null;

  const sorted = [...published].sort((a, b) => engagementRate(b) - engagementRate(a));
  const topN = Math.max(1, Math.floor(sorted.length * 0.25));
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);

  const avg = (arr, key) => arr.length ? arr.reduce((s, p) => s + (p.analytics?.[key] ?? 0), 0) / arr.length : 0;

  const metrics = ['likes', 'shares', 'comments', 'impressions', 'clicks'];
  const topEngAvg = top.reduce((s, p) => s + engagementRate(p), 0) / top.length;
  const restEngAvg = rest.length ? rest.reduce((s, p) => s + engagementRate(p), 0) / rest.length : 0;

  // Analyze patterns in top posts
  const topPlatforms = top.reduce((acc, p) => { acc[p.platform] = (acc[p.platform] || 0) + 1; return acc; }, {});
  const topPlatform = Object.entries(topPlatforms).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topTones = top.filter(p => p.tone).reduce((acc, p) => { acc[p.tone] = (acc[p.tone] || 0) + 1; return acc; }, {});
  const topTone = Object.entries(topTones).sort((a, b) => b[1] - a[1])[0]?.[0];
  const avgDraftLen = top.reduce((s, p) => s + (p.draft?.length ?? 0), 0) / top.length;

  const chartData = metrics.map(key => ({
    metric: key.charAt(0).toUpperCase() + key.slice(1),
    'Top 25%': Math.round(avg(top, key)),
    'Others': Math.round(avg(rest, key)),
  }));

  return (
    <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
        <Target className="h-3.5 w-3.5 text-violet-400" /> Historical Best vs. Rest
        <span className="text-[10px] text-zinc-500 font-normal">Top 25% vs. remaining posts</span>
      </p>

      {/* Eng rate comparison */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-emerald-400">{topEngAvg.toFixed(2)}%</p>
          <p className="text-[9px] text-zinc-500">Top {topN} posts avg eng.</p>
        </div>
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-zinc-300">{restEngAvg.toFixed(2)}%</p>
          <p className="text-[9px] text-zinc-500">Other posts avg eng.</p>
        </div>
      </div>

      {/* Bar comparison */}
      <div className="space-y-1.5">
        {chartData.map(d => {
          const max = Math.max(d['Top 25%'], d['Others'], 1);
          return (
            <div key={d.metric} className="space-y-0.5">
              <span className="text-[10px] text-zinc-500">{d.metric}</span>
              <div className="flex gap-1 items-center">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/70 rounded-full" style={{ width: `${(d['Top 25%'] / max) * 100}%` }} />
                </div>
                <span className="text-[9px] text-emerald-400 w-12 text-right">{d['Top 25%'].toLocaleString()}</span>
              </div>
              <div className="flex gap-1 items-center">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-600/70 rounded-full" style={{ width: `${(d['Others'] / max) * 100}%` }} />
                </div>
                <span className="text-[9px] text-zinc-500 w-12 text-right">{d['Others'].toLocaleString()}</span>
              </div>
            </div>
          );
        })}
        <div className="flex gap-3 pt-1">
          <span className="flex items-center gap-1 text-[9px] text-zinc-500"><span className="h-2 w-2 rounded-full bg-emerald-500/70" /> Top 25%</span>
          <span className="flex items-center gap-1 text-[9px] text-zinc-500"><span className="h-2 w-2 rounded-full bg-zinc-600/70" /> Others</span>
        </div>
      </div>

      {/* Pattern hints */}
      <div className="space-y-1">
        <p className="text-[10px] text-zinc-500 font-medium">Patterns in top posts:</p>
        {topPlatform && (
          <p className="text-[10px] text-zinc-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            Most top performers are on <span className="text-emerald-400 font-medium capitalize">{topPlatform}</span>
          </p>
        )}
        {topTone && (
          <p className="text-[10px] text-zinc-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            Tone "<span className="text-emerald-400 font-medium">{topTone}</span>" appears most in high performers
          </p>
        )}
        {avgDraftLen > 0 && (
          <p className="text-[10px] text-zinc-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            Top posts avg <span className="text-emerald-400 font-medium">{Math.round(avgDraftLen)} chars</span> in draft length
          </p>
        )}
      </div>
    </div>
  );
}

// ─── AI-style Optimization Suggestions ───────────────────────────────────────

function OptimizationSuggestions({ posts }) {
  const published = posts.filter(p => p.status === 'published' && p.analytics);
  if (!published.length) return null;

  const suggestions = useMemo(() => {
    const tips = [];
    const sorted = [...published].sort((a, b) => engagementRate(b) - engagementRate(a));
    const avgEng = published.reduce((s, p) => s + engagementRate(p), 0) / published.length;

    // Check engagement vs benchmarks per platform
    ['twitter', 'linkedin', 'instagram'].forEach(pid => {
      const pp = published.filter(p => p.platform === pid);
      if (!pp.length) return;
      const bench = INDUSTRY_BENCHMARKS[pid];
      const avg = pp.reduce((s, p) => s + engagementRate(p), 0) / pp.length;
      const diff = avg - bench.engagement_rate;
      if (diff < -bench.engagement_rate * 0.3) {
        tips.push({
          type: 'warning',
          platform: pid,
          text: `Your ${bench.label} engagement rate (${avg.toFixed(2)}%) is significantly below the industry average (${bench.engagement_rate}%). Try posting at peak hours and using more questions or CTAs.`,
        });
      } else if (diff > bench.engagement_rate * 0.5) {
        tips.push({
          type: 'success',
          platform: pid,
          text: `Excellent! Your ${bench.label} engagement (${avg.toFixed(2)}%) beats the industry average by ${(diff).toFixed(2)}pp. Keep this content style going.`,
        });
      }
    });

    // Hashtag usage
    const withHashtags = published.filter(p => p.hashtags?.length > 0);
    const withHashEng = withHashtags.length ? withHashtags.reduce((s, p) => s + engagementRate(p), 0) / withHashtags.length : 0;
    const withoutHashEng = published.filter(p => !p.hashtags?.length).length
      ? published.filter(p => !p.hashtags?.length).reduce((s, p) => s + engagementRate(p), 0) / published.filter(p => !p.hashtags?.length).length
      : 0;
    if (withHashtags.length > 1 && withHashEng > withoutHashEng * 1.1) {
      tips.push({ type: 'info', text: `Posts with hashtags get ${((withHashEng / Math.max(withoutHashEng, 0.01) - 1) * 100).toFixed(0)}% higher engagement on average. Keep using relevant hashtags.` });
    } else if (withHashtags.length > 1 && withHashEng < withoutHashEng * 0.9) {
      tips.push({ type: 'warning', text: `Posts without hashtags are outperforming those with them. Consider refining your hashtag strategy or posting without them.` });
    }

    // Consistency
    if (published.length >= 5) {
      const engValues = sorted.map(p => engagementRate(p));
      const max = engValues[0], min = engValues[engValues.length - 1];
      if (max / Math.max(min, 0.01) > 5) {
        tips.push({ type: 'info', text: `Your engagement varies widely (${min.toFixed(2)}%–${max.toFixed(2)}%). Study your top posts to replicate what's working.` });
      }
    }

    // Low impressions across the board
    const avgImpressions = published.reduce((s, p) => s + (p.analytics?.impressions ?? 0), 0) / published.length;
    if (avgImpressions < 500) {
      tips.push({ type: 'warning', text: `Average impressions are low (${Math.round(avgImpressions)}). Consider boosting posts, cross-promoting, or posting more frequently to grow reach.` });
    }

    // Click-through rate
    const avgCTR = published.reduce((s, p) => {
      const imp = p.analytics?.impressions ?? 0;
      const clicks = p.analytics?.clicks ?? 0;
      return s + (imp > 0 ? (clicks / imp) * 100 : 0);
    }, 0) / published.length;
    if (avgCTR < 1) {
      tips.push({ type: 'info', text: `Click-through rate is below 1% (${avgCTR.toFixed(2)}%). Add clear calls-to-action and compelling links to drive more traffic.` });
    }

    if (!tips.length) {
      tips.push({ type: 'success', text: 'Your content is performing well across the board. Keep up the great work and maintain your posting cadence!' });
    }

    return tips;
  }, [published]);

  const iconMap = {
    warning: <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />,
    info: <Info className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />,
  };

  const bgMap = {
    warning: 'bg-amber-500/5 border-amber-500/20',
    success: 'bg-emerald-500/5 border-emerald-500/20',
    info: 'bg-violet-500/5 border-violet-500/20',
  };

  return (
    <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Optimization Suggestions
      </p>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div key={i} className={cn('flex gap-2 rounded-lg border px-3 py-2', bgMap[s.type])}>
            {iconMap[s.type]}
            <p className="text-xs text-zinc-300 leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function BenchmarkPanel({ posts }) {
  const published = posts.filter(p => p.status === 'published' && p.analytics);

  if (!published.length) {
    return (
      <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-6 text-center text-zinc-600 text-xs">
        <Target className="h-6 w-6 mx-auto mb-2 opacity-40" />
        Publish posts and refresh their metrics to see benchmarking data.
      </div>
    );
  }

  const platforms = [...new Set(published.map(p => p.platform))];

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
        <Target className="h-3.5 w-3.5 text-violet-400" /> Performance Benchmarking
      </p>

      {/* Industry benchmarks per platform */}
      <div className="space-y-2">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wide">vs. Industry Averages</p>
        {platforms.map(pid => (
          <PlatformBenchmark key={pid} pid={pid} posts={posts} />
        ))}
      </div>

      {/* Historical best */}
      <HistoricalBest posts={posts} />

      {/* Optimization tips */}
      <OptimizationSuggestions posts={posts} />
    </div>
  );
}