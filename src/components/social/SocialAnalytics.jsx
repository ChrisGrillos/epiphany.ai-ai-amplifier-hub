import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Heart, Share2, MessageCircle, Eye, MousePointerClick,
  Twitter, Linkedin, Instagram, RefreshCw, TrendingUp, BarChart2,
  CalendarClock, Loader2, Trophy, Percent, Users, Filter, Calendar
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie, Legend
} from 'recharts';
import { format, parseISO, subDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import BenchmarkPanel from './BenchmarkPanel';
import CompetitorAnalysis from './CompetitorAnalysis';

// ─── Constants ────────────────────────────────────────────────────────────────

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

const DATE_RANGES = [
  { label: '7d',  days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: null },
];

const PLATFORM_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'twitter', label: 'X', Icon: Twitter, color: 'text-sky-400' },
  { id: 'linkedin', label: 'LinkedIn', Icon: Linkedin, color: 'text-blue-400' },
  { id: 'instagram', label: 'Instagram', Icon: Instagram, color: 'text-pink-400' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Shared UI ────────────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon className={cn('h-3.5 w-3.5', color)} />
        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</span>
      {sub && <span className="text-[10px] text-zinc-600">{sub}</span>}
    </div>
  );
}

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

// ─── Section: Filters ─────────────────────────────────────────────────────────

function DashboardFilters({ dateRange, setDateRange, platformFilter, setPlatformFilter }) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-zinc-800/40 border border-zinc-700 rounded-xl px-3 py-2.5">
      {/* Date Range */}
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-[10px] text-zinc-500">Range:</span>
        <div className="flex gap-0.5">
          {DATE_RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setDateRange(r.days)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                dateRange === r.days
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-4 bg-zinc-700" />

      {/* Platform */}
      <div className="flex items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-[10px] text-zinc-500">Platform:</span>
        <div className="flex gap-0.5">
          {PLATFORM_FILTERS.map(f => {
            const Icon = f.Icon;
            return (
              <button
                key={f.id}
                onClick={() => setPlatformFilter(f.id)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                  platformFilter === f.id
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {Icon && <Icon className={cn('h-3 w-3', platformFilter === f.id ? 'text-white' : f.color)} />}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Section: KPI Summary Row ─────────────────────────────────────────────────

function KPISummary({ posts }) {
  const published = posts.filter(p => p.status === 'published' && p.analytics);
  const totals = METRICS.reduce((acc, m) => {
    acc[m.key] = published.reduce((s, p) => s + (p.analytics?.[m.key] ?? 0), 0);
    return acc;
  }, {});
  const avgEng = published.length
    ? (published.reduce((s, p) => s + engagementRate(p), 0) / published.length).toFixed(2)
    : '0.00';

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {METRICS.map(m => (
        <MetricCard key={m.key} icon={m.Icon} label={m.label} value={totals[m.key]} color={m.color} />
      ))}
      <MetricCard
        icon={Percent}
        label="Avg Eng. Rate"
        value={`${avgEng}%`}
        sub={`${published.length} posts`}
        color="text-emerald-400"
      />
    </div>
  );
}

// ─── Section: Engagement Trend ────────────────────────────────────────────────

function EngagementTrend({ posts }) {
  const [activeMetrics, setActiveMetrics] = useState(['likes', 'shares', 'comments']);

  const published = posts
    .filter(p => p.status === 'published' && p.analytics && p.published_at)
    .sort((a, b) => new Date(a.published_at) - new Date(b.published_at));

  if (published.length < 2) {
    return (
      <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-6 text-center text-zinc-600 text-xs">
        Need at least 2 published posts to show trends.
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
    eng_rate:    parseFloat(engagementRate(p).toFixed(2)),
  }));

  const toggle = key => setActiveMetrics(prev =>
    prev.includes(key)
      ? prev.length > 1 ? prev.filter(k => k !== key) : prev
      : [...prev, key]
  );

  return (
    <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-violet-400" /> Engagement Over Time
        </p>
        <div className="flex flex-wrap gap-1">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => toggle(m.key)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] border transition-colors',
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
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<DarkTooltip />} />
          {METRICS.map(m => activeMetrics.includes(m.key) && (
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

// ─── Section: Platform Breakdown ──────────────────────────────────────────────

function PlatformBreakdown({ posts }) {
  const published = posts.filter(p => p.status === 'published' && p.analytics);

  const byPlatform = Object.entries(PLATFORM_META).map(([pid, meta]) => {
    const pp = published.filter(p => p.platform === pid);
    const total = pp.reduce((s, p) => s + (p.analytics?.likes ?? 0) + (p.analytics?.shares ?? 0) + (p.analytics?.comments ?? 0), 0);
    const avgEng = pp.length ? (pp.reduce((s, p) => s + engagementRate(p), 0) / pp.length).toFixed(1) : '0.0';
    return {
      name: meta.label,
      posts: pp.length,
      engagement: parseFloat(avgEng),
      total,
      likes:    pp.reduce((s, p) => s + (p.analytics?.likes ?? 0), 0),
      shares:   pp.reduce((s, p) => s + (p.analytics?.shares ?? 0), 0),
      comments: pp.reduce((s, p) => s + (p.analytics?.comments ?? 0), 0),
      impressions: pp.reduce((s, p) => s + (p.analytics?.impressions ?? 0), 0),
      chartColor: meta.chartColor,
      meta,
      pid,
    };
  });

  const pieData = byPlatform.filter(d => d.total > 0).map(d => ({ name: d.name, value: d.total, color: d.chartColor }));

  if (!published.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Stacked bar */}
      <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
          <BarChart2 className="h-3.5 w-3.5 text-violet-400" /> Engagement by Platform
        </p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={byPlatform} barSize={24} margin={{ left: -20 }}>
            <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="likes" name="Likes" stackId="a">
              {byPlatform.map((d, i) => <Cell key={i} fill={d.chartColor} fillOpacity={0.95} />)}
            </Bar>
            <Bar dataKey="shares" name="Shares" stackId="a">
              {byPlatform.map((d, i) => <Cell key={i} fill={d.chartColor} fillOpacity={0.6} />)}
            </Bar>
            <Bar dataKey="comments" name="Comments" stackId="a" radius={[3, 3, 0, 0]}>
              {byPlatform.map((d, i) => <Cell key={i} fill={d.chartColor} fillOpacity={0.3} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Platform stats table */}
      <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
          <Percent className="h-3.5 w-3.5 text-emerald-400" /> Platform Performance
        </p>
        <div className="space-y-2">
          {byPlatform.map(d => {
            const Icon = d.meta.Icon;
            return (
              <div key={d.pid} className={cn('flex items-center gap-3 rounded-lg px-3 py-2', d.meta.bg, `border ${d.meta.border}`)}>
                <Icon className={cn('h-4 w-4 shrink-0', d.meta.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-medium', d.meta.color)}>{d.meta.label}</span>
                    <span className="text-[10px] text-zinc-400">{d.posts} posts</span>
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-[9px] text-zinc-500">❤ {d.likes.toLocaleString()}</span>
                    <span className="text-[9px] text-zinc-500">↗ {d.shares.toLocaleString()}</span>
                    <span className="text-[9px] text-zinc-500">💬 {d.comments.toLocaleString()}</span>
                    <span className="text-[9px] text-emerald-500 ml-auto">{d.engagement}% eng</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Team Contributions ──────────────────────────────────────────────

function TeamContributions({ posts }) {
  const allPosts = posts;

  // Count posts by creator (created_by)
  const byMember = useMemo(() => {
    const map = {};
    allPosts.forEach(p => {
      const key = p.created_by || 'Unknown';
      if (!map[key]) map[key] = { email: key, posts: 0, scheduled: 0, published: 0, approved: 0, rejected: 0, comments: 0 };
      map[key].posts++;
      if (p.status === 'scheduled') map[key].scheduled++;
      if (p.status === 'published') map[key].published++;
      if (p.approval_status === 'approved') map[key].approved++;
      if (p.approval_status === 'rejected') map[key].rejected++;
      // Count comments authored by this person
      (p.comments || []).forEach(c => {
        const ck = c.author_email || 'Unknown';
        if (!map[ck]) map[ck] = { email: ck, posts: 0, scheduled: 0, published: 0, approved: 0, rejected: 0, comments: 0 };
        map[ck].comments++;
      });
    });
    return Object.values(map).sort((a, b) => b.posts - a.posts);
  }, [allPosts]);

  if (!byMember.length) return null;

  const chartData = byMember.slice(0, 6).map(m => ({
    name: m.email.split('@')[0],
    scheduled: m.scheduled,
    published: m.published,
    comments: m.comments,
  }));

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-violet-400" /> Team Contributions
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Bar chart */}
        <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 space-y-2">
          <p className="text-[10px] text-zinc-500">Posts per Member</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} barSize={14} margin={{ left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="scheduled" name="Scheduled" fill="#a78bfa" radius={[2, 2, 0, 0]} />
              <Bar dataKey="published" name="Published"  fill="#34d399" radius={[2, 2, 0, 0]} />
              <Bar dataKey="comments"  name="Comments"   fill="#fbbf24" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leaderboard */}
        <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 space-y-2">
          <p className="text-[10px] text-zinc-500">Leaderboard</p>
          <div className="space-y-1.5">
            {byMember.slice(0, 5).map((m, i) => (
              <div key={m.email} className="flex items-center gap-2">
                <span className={cn(
                  'h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0',
                  i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-zinc-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-700 text-zinc-400'
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 truncate">{m.email}</p>
                  <div className="flex gap-2 text-[9px] text-zinc-600">
                    <span>{m.posts} posts</span>
                    <span>·</span>
                    <span>{m.published} published</span>
                    <span>·</span>
                    <span>{m.comments} comments</span>
                  </div>
                </div>
                {i === 0 && <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Top Posts ───────────────────────────────────────────────────────

const TOP_POST_SORT = [
  { key: 'likes', label: 'Likes' },
  { key: 'shares', label: 'Shares' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'engagement_rate', label: 'Eng. Rate' },
];

function TopPosts({ posts }) {
  const [sortBy, setSortBy] = useState('likes');
  const published = posts.filter(p => p.status === 'published' && p.analytics);
  if (!published.length) return null;

  const sorted = [...published].sort((a, b) => {
    if (sortBy === 'engagement_rate') return engagementRate(b) - engagementRate(a);
    return (b.analytics?.[sortBy] ?? 0) - (a.analytics?.[sortBy] ?? 0);
  }).slice(0, 5);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-400" /> Top Performing Posts
        </p>
        <div className="flex gap-1">
          {TOP_POST_SORT.map(m => (
            <button
              key={m.key}
              onClick={() => setSortBy(m.key)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] border transition-colors',
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
      <div className="space-y-2">
        {sorted.map((post, rank) => {
          const meta = PLATFORM_META[post.platform];
          const Icon = meta.Icon;
          const value = sortBy === 'engagement_rate'
            ? `${engagementRate(post).toFixed(2)}%`
            : (post.analytics?.[sortBy] ?? 0).toLocaleString();
          return (
            <div key={post.id} className={cn('rounded-xl border p-3', meta.bg, meta.border)}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn(
                  'h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0',
                  rank === 0 ? 'bg-amber-500 text-black' : rank === 1 ? 'bg-zinc-400 text-black' : 'bg-zinc-700 text-zinc-400'
                )}>
                  {rank + 1}
                </span>
                <Icon className={cn('h-3.5 w-3.5 shrink-0', meta.color)} />
                <span className={cn('text-[10px] font-semibold', meta.color)}>{meta.label}</span>
                {post.published_at && (
                  <span className="text-[9px] text-zinc-600">{format(parseISO(post.published_at), 'MMM d')}</span>
                )}
                <span className={cn('ml-auto text-sm font-bold', meta.color)}>{value}</span>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2 pl-7">{post.draft}</p>
              <div className="flex gap-3 pl-7 mt-1">
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
    <div className={cn('rounded-xl border p-3 space-y-2', bg, border)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />
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
        <div className="flex gap-3 flex-wrap pt-0.5">
          {METRICS.map(m => (
            <div key={m.key} className="flex flex-col items-center gap-0.5 min-w-[44px]">
              <m.Icon className={cn('h-3 w-3', m.color)} />
              <span className="text-xs font-bold text-white">{(a[m.key] ?? 0).toLocaleString()}</span>
              <span className="text-[9px] text-zinc-600">{m.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-zinc-600 italic">No metrics yet — click refresh to fetch.</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SocialAnalytics() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState(30);
  const [platformFilter, setPlatformFilter] = useState('all');

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ['scheduled_posts'],
    queryFn: () => base44.entities.ScheduledPost.list('-scheduled_at', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScheduledPost.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled_posts'] }),
  });

  // Apply filters
  const posts = useMemo(() => {
    let filtered = allPosts;

    // Date range filter (based on scheduled_at or published_at)
    if (dateRange !== null) {
      const cutoff = startOfDay(subDays(new Date(), dateRange));
      filtered = filtered.filter(p => {
        const dateStr = p.published_at || p.scheduled_at;
        if (!dateStr) return false;
        return isAfter(parseISO(dateStr), cutoff);
      });
    }

    // Platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(p => p.platform === platformFilter);
    }

    return filtered;
  }, [allPosts, dateRange, platformFilter]);

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

  if (!allPosts.length) {
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
      {/* Filters */}
      <DashboardFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        platformFilter={platformFilter}
        setPlatformFilter={setPlatformFilter}
      />

      {/* Filter context */}
      <div className="flex items-center gap-2 text-[10px] text-zinc-600">
        <span>Showing {posts.length} posts</span>
        {dateRange && <span>· Last {dateRange} days</span>}
        {platformFilter !== 'all' && <span>· {PLATFORM_META[platformFilter]?.label}</span>}
      </div>

      {/* KPI Summary */}
      <KPISummary posts={posts} />

      {/* Engagement Trend */}
      {hasPublished && <EngagementTrend posts={posts} />}

      {/* Platform Breakdown */}
      {hasPublished && <PlatformBreakdown posts={posts} />}

      {/* Benchmarking */}
      <BenchmarkPanel posts={posts} />

      {/* Competitor Analysis */}
      <CompetitorAnalysis
        userAvgEngagement={
          published.length
            ? published.reduce((s, p) => s + (p.analytics?.impressions
                ? ((p.analytics.likes + p.analytics.shares + p.analytics.comments) / p.analytics.impressions) * 100
                : 0), 0) / published.length
            : null
        }
      />

      {/* Team Contributions */}
      <TeamContributions posts={allPosts} />

      {/* Top Posts */}
      {hasPublished && <TopPosts posts={posts} />}

      {/* Per-post list */}
      {hasPublished && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5 text-violet-400" /> All Published Posts
              <Badge className="bg-zinc-800 text-zinc-400 border-0 text-[10px]">{published.length}</Badge>
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
          <p className="text-xs">No published posts in this range. Use the Queue tab to simulate publishing.</p>
        </div>
      )}
    </div>
  );
}