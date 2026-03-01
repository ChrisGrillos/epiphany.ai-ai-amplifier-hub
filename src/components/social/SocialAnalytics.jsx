import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Heart, Share2, MessageCircle, Eye, MousePointerClick,
  Twitter, Linkedin, Instagram, RefreshCw, TrendingUp, BarChart2,
  CalendarClock, Loader2, Trophy, Percent
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORM_META = {
  twitter:   { label: 'X / Twitter', Icon: Twitter,   color: 'text-sky-400',  bg: 'bg-sky-500/10',   border: 'border-sky-500/30',  chartColor: '#38bdf8' },
  linkedin:  { label: 'LinkedIn',    Icon: Linkedin,   color: 'text-blue-400', bg: 'bg-blue-500/10',  border: 'border-blue-500/30', chartColor: '#60a5fa' },
  instagram: { label: 'Instagram',   Icon: Instagram,  color: 'text-pink-400', bg: 'bg-pink-500/10',  border: 'border-pink-500/30', chartColor: '#f472b6' },
};

const METRICS = [
  { key: 'likes',       label: 'Likes',       Icon: Heart,             color: 'text-rose-400',    chartColor: '#fb7185' },
  { key: 'shares',      label: 'Shares',      Icon: Share2,            color: 'text-violet-400',  chartColor: '#a78bfa' },
  { key: 'comments',    label: 'Comments',    Icon: MessageCircle,     color: 'text-amber-400',   chartColor: '#fbbf24' },
  { key: 'impressions', label: 'Impressions', Icon: Eye,               color: 'text-emerald-400', chartColor: '#34d399' },
  { key: 'clicks',      label: 'Clicks',      Icon: MousePointerClick, color: 'text-cyan-400',    chartColor: '#22d3ee' },
];

const TOP_POST_METRICS = [
  { key: 'likes',           label: 'Likes' },
  { key: 'shares',          label: 'Shares' },
  { key: 'comments',        label: 'Comments' },
  { key: 'impressions',     label: 'Impressions' },
  { key: 'engagement_rate', label: 'Engagement Rate' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchMockAnalytics(post) {
  await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
  const base = { twitter: 50, linkedin: 200, instagram: 300 }[post.platform] || 100;
  return {
    likes:       Math.floor(Math.random() * base * 3),
    shares:      Math.floor(Math.random() * base),
    comments:    Math.floor(Math.random() * base * 0.5),
    impressions: Math.floor(Math.random() * base * 20),
    clicks:      Math.floor(Math.random() * base * 2),
    last_fetched: new Date().toISOString(),
  };
}

function engagementRate(post) {
  const a = post.analytics;
  if (!a || !a.impressions) return 0;
  return ((a.likes + a.shares + a.comments) / a.impressions) * 100;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricChip({ icon: Icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[52px]">
      <Icon className={cn('h-3.5 w-3.5', color)} />
      <span className="text-sm font-bold text-white">{value?.toLocaleString() ?? '—'}</span>
      <span className="text-[9px] text-zinc-600 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// Tooltip override for dark theme
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-300">{p.name}:</span>
          <span className="text-white font-medium">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Trendline Section ────────────────────────────────────────────────────────

function TrendlineChart({ posts }) {
  const [activeMetrics, setActiveMetrics] = useState(['likes', 'shares', 'comments']);

  const published = posts
    .filter(p => p.status === 'published' && p.analytics && p.published_at)
    .sort((a, b) => new Date(a.published_at) - new Date(b.published_at));

  if (published.length < 2) {
    return (
      <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 text-center text-zinc-600 text-xs">
        Need at least 2 published posts to show a trendline.
      </div>
    );
  }

  const data = published.map(p => ({
    date: format(parseISO(p.published_at), 'MMM d'),
    likes:       p.analytics.likes ?? 0,
    shares:      p.analytics.shares ?? 0,
    comments:    p.analytics.comments ?? 0,
    impressions: p.analytics.impressions ?? 0,
    clicks:      p.analytics.clicks ?? 0,
  }));

  const toggleMetric = (key) => {
    setActiveMetrics(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : [...prev, key]
    );
  };

  return (
    <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-violet-400" /> Metrics Over Time
        </p>
        <div className="flex flex-wrap gap-1">
          {METRICS.slice(0, 3).map(m => (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              className={cn(
                'px-2 py-0.5 rounded-md text-[10px] border transition-colors',
                activeMetrics.includes(m.key)
                  ? cn(m.color, 'border-current bg-current/10')
                  : 'text-zinc-600 border-zinc-700 hover:text-zinc-400'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<DarkTooltip />} />
          {METRICS.slice(0, 3).map(m => activeMetrics.includes(m.key) && (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.key}
              name={m.label}
              stroke={m.chartColor}
              strokeWidth={2}
              dot={{ r: 3, fill: m.chartColor }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Engagement Rate Section ──────────────────────────────────────────────────

function EngagementRates({ posts }) {
  const published = posts.filter(p => p.status === 'published' && p.analytics);
  if (!published.length) return null;

  const overall = published.length
    ? (published.reduce((s, p) => s + engagementRate(p), 0) / published.length).toFixed(2)
    : '0.00';

  const byPlatform = Object.entries(PLATFORM_META).map(([pid, meta]) => {
    const pp = published.filter(p => p.platform === pid);
    const avg = pp.length
      ? (pp.reduce((s, p) => s + engagementRate(p), 0) / pp.length).toFixed(2)
      : null;
    return { pid, meta, avg, count: pp.length };
  }).filter(d => d.avg !== null);

  return (
    <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
        <Percent className="h-3.5 w-3.5 text-emerald-400" /> Engagement Rate
        <span className="text-[10px] text-zinc-500 font-normal">(likes+shares+comments) / impressions</span>
      </p>
      <div className="flex flex-wrap gap-3">
        {/* Overall */}
        <div className="flex flex-col items-center gap-0.5 bg-zinc-800 rounded-lg px-4 py-2.5">
          <span className="text-lg font-bold text-white">{overall}%</span>
          <span className="text-[9px] text-zinc-500 uppercase tracking-wide">Overall Avg</span>
          <span className="text-[9px] text-zinc-700">{published.length} posts</span>
        </div>
        {/* Per platform */}
        {byPlatform.map(({ pid, meta, avg, count }) => {
          const Icon = meta.Icon;
          return (
            <div key={pid} className={cn('flex flex-col items-center gap-0.5 rounded-lg px-4 py-2.5', meta.bg, `border ${meta.border}`)}>
              <Icon className={cn('h-3.5 w-3.5 mb-0.5', meta.color)} />
              <span className={cn('text-lg font-bold', meta.color)}>{avg}%</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wide">{meta.label}</span>
              <span className="text-[9px] text-zinc-600">{count} post{count !== 1 ? 's' : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Top Posts Section ────────────────────────────────────────────────────────

function TopPosts({ posts }) {
  const [sortBy, setSortBy] = useState('likes');

  const published = posts.filter(p => p.status === 'published' && p.analytics);
  if (!published.length) return null;

  const sorted = [...published].sort((a, b) => {
    if (sortBy === 'engagement_rate') return engagementRate(b) - engagementRate(a);
    return (b.analytics?.[sortBy] ?? 0) - (a.analytics?.[sortBy] ?? 0);
  }).slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-400" /> Top Performing Posts
        </p>
        <div className="flex gap-1 flex-wrap">
          {TOP_POST_METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setSortBy(m.key)}
              className={cn(
                'px-2 py-0.5 rounded-md text-[10px] border transition-colors',
                sortBy === m.key
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'text-zinc-600 border-zinc-700 hover:text-zinc-400'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {sorted.map((post, rank) => {
        const meta = PLATFORM_META[post.platform];
        const Icon = meta.Icon;
        const value = sortBy === 'engagement_rate'
          ? `${engagementRate(post).toFixed(2)}%`
          : (post.analytics?.[sortBy] ?? 0).toLocaleString();

        return (
          <div key={post.id} className={cn('rounded-xl border p-3 space-y-1.5', meta.bg, meta.border)}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0',
                  rank === 0 ? 'bg-amber-500 text-black' : rank === 1 ? 'bg-zinc-400 text-black' : 'bg-amber-900/60 text-amber-300'
                )}>
                  {rank + 1}
                </span>
                <Icon className={cn('h-3.5 w-3.5 shrink-0', meta.color)} />
                <span className={cn('text-[10px] font-semibold', meta.color)}>{meta.label}</span>
                {post.published_at && (
                  <span className="text-[9px] text-zinc-600">{format(parseISO(post.published_at), 'MMM d')}</span>
                )}
              </div>
              <span className={cn('text-sm font-bold', meta.color)}>{value}</span>
            </div>
            <p className="text-xs text-zinc-400 line-clamp-2 pl-7">{post.draft}</p>
            <div className="flex gap-3 pl-7">
              {METRICS.slice(0, 3).map(m => (
                <span key={m.key} className="text-[9px] text-zinc-600">
                  {m.label}: <span className="text-zinc-400">{(post.analytics?.[m.key] ?? 0).toLocaleString()}</span>
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Aggregate Summary ────────────────────────────────────────────────────────

function AggregateSummary({ posts }) {
  const published = posts.filter(p => p.status === 'published' && p.analytics);
  if (!published.length) return null;

  const totals = METRICS.reduce((acc, m) => {
    acc[m.key] = published.reduce((s, p) => s + (p.analytics?.[m.key] ?? 0), 0);
    return acc;
  }, {});

  const byPlatform = Object.entries(PLATFORM_META).map(([pid, meta]) => {
    const pp = published.filter(p => p.platform === pid);
    return {
      name: meta.label,
      likes:    pp.reduce((s, p) => s + (p.analytics?.likes ?? 0), 0),
      shares:   pp.reduce((s, p) => s + (p.analytics?.shares ?? 0), 0),
      comments: pp.reduce((s, p) => s + (p.analytics?.comments ?? 0), 0),
      color: meta.chartColor,
    };
  }).filter(d => d.likes + d.shares + d.comments > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-violet-400" />
        <p className="text-xs font-semibold text-zinc-200">Aggregate Performance</p>
        <Badge className="bg-zinc-800 text-zinc-400 border-0 text-[10px]">
          {published.length} post{published.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      <div className="flex gap-4 flex-wrap bg-zinc-800/40 border border-zinc-700 rounded-xl px-4 py-3">
        {METRICS.map(m => (
          <MetricChip key={m.key} icon={m.Icon} label={m.label} value={totals[m.key]} color={m.color} />
        ))}
      </div>
      {byPlatform.length > 0 && (
        <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-3">
          <p className="text-[10px] text-zinc-500 mb-2 flex items-center gap-1">
            <BarChart2 className="h-3 w-3" /> Engagement by Platform
          </p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={byPlatform} barSize={16} barGap={4} margin={{ left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="likes" name="Likes" stackId="a">
                {byPlatform.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.9} />)}
              </Bar>
              <Bar dataKey="shares" name="Shares" stackId="a">
                {byPlatform.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.6} />)}
              </Bar>
              <Bar dataKey="comments" name="Comments" stackId="a" radius={[3, 3, 0, 0]}>
                {byPlatform.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.3} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Per-post card ────────────────────────────────────────────────────────────

function PostAnalyticsCard({ post, onRefresh }) {
  const meta = PLATFORM_META[post.platform];
  const { Icon, label, color, bg, border } = meta;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => { setRefreshing(true); await onRefresh(post); setRefreshing(false); };
  const a = post.analytics;
  const dateLabel = post.published_at
    ? format(parseISO(post.published_at), 'MMM d, yyyy')
    : post.scheduled_at ? format(parseISO(post.scheduled_at), 'MMM d, yyyy') : null;

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', bg, border)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <Icon className={cn('h-4 w-4 shrink-0', color)} />
          <span className={cn('text-xs font-semibold', color)}>{label}</span>
          {post.account_handle && <span className="text-[10px] text-zinc-500">@{post.account_handle}</span>}
          {dateLabel && (
            <span className="text-[10px] text-zinc-600 flex items-center gap-1">
              <CalendarClock className="h-2.5 w-2.5" />{dateLabel}
            </span>
          )}
          {a && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[9px]">
              {engagementRate(post).toFixed(1)}% eng.
            </Badge>
          )}
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0">
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
        </button>
      </div>
      <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">{post.draft}</p>
      {a ? (
        <>
          <div className="flex gap-4 flex-wrap pt-1">
            {METRICS.map(m => <MetricChip key={m.key} icon={m.Icon} label={m.label} value={a[m.key]} color={m.color} />)}
          </div>
          {a.last_fetched && (
            <p className="text-[9px] text-zinc-700">Last updated {format(parseISO(a.last_fetched), 'MMM d, h:mm a')}</p>
          )}
        </>
      ) : (
        <p className="text-[10px] text-zinc-600 italic">No metrics yet — click refresh to fetch.</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SocialAnalytics() {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['scheduled_posts'],
    queryFn: () => base44.entities.ScheduledPost.list('-scheduled_at', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScheduledPost.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled_posts'] }),
  });

  const published = posts.filter(p => p.status === 'published');

  const handleRefreshAll = async () => {
    if (!published.length) { toast.info('No published posts to refresh'); return; }
    toast.info(`Fetching metrics for ${published.length} posts…`);
    await Promise.all(published.map(async post => {
      const analytics = await fetchMockAnalytics(post);
      await updateMutation.mutateAsync({ id: post.id, data: { analytics } });
    }));
    toast.success('All metrics updated');
  };

  const handleRefreshOne = async (post) => {
    const analytics = await fetchMockAnalytics(post);
    await updateMutation.mutateAsync({ id: post.id, data: { analytics } });
    toast.success('Metrics updated');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-600">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="text-center py-10 text-zinc-600">
        <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-xs">No posts yet. Schedule some posts from the Compose tab.</p>
      </div>
    );
  }

  const hasPublished = published.length > 0;

  return (
    <div className="space-y-5">
      {/* Aggregate totals + platform bar */}
      <AggregateSummary posts={posts} />

      {/* Trendline */}
      {hasPublished && <TrendlineChart posts={posts} />}

      {/* Engagement rates */}
      {hasPublished && <EngagementRates posts={posts} />}

      {/* Top posts */}
      {hasPublished && <TopPosts posts={posts} />}

      {/* Per-post cards */}
      {hasPublished && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5 text-violet-400" /> All Published Posts
            </p>
            <Button variant="ghost" size="sm" onClick={handleRefreshAll} className="h-7 text-[10px] text-zinc-500 hover:text-white px-2">
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh All
            </Button>
          </div>
          <div className="space-y-2">
            {published.map(post => (
              <PostAnalyticsCard key={post.id} post={post} onRefresh={handleRefreshOne} />
            ))}
          </div>
        </div>
      )}

      {!hasPublished && (
        <div className="text-center py-4 text-zinc-600">
          <p className="text-xs">Posts are scheduled but none published yet. Use the Queue tab to simulate publishing.</p>
        </div>
      )}
    </div>
  );
}