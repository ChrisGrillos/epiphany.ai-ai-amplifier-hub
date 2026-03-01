import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Heart, Share2, MessageCircle, Eye, MousePointerClick,
  Twitter, Linkedin, Instagram, RefreshCw, TrendingUp, BarChart2,
  CalendarClock, Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';

const PLATFORM_META = {
  twitter:   { label: 'X / Twitter', Icon: Twitter,   color: 'text-sky-400',  bg: 'bg-sky-500/10',   border: 'border-sky-500/30',  chartColor: '#38bdf8' },
  linkedin:  { label: 'LinkedIn',    Icon: Linkedin,   color: 'text-blue-400', bg: 'bg-blue-500/10',  border: 'border-blue-500/30', chartColor: '#60a5fa' },
  instagram: { label: 'Instagram',   Icon: Instagram,  color: 'text-pink-400', bg: 'bg-pink-500/10',  border: 'border-pink-500/30', chartColor: '#f472b6' },
};

const METRICS = [
  { key: 'likes',       label: 'Likes',       Icon: Heart,             color: 'text-rose-400' },
  { key: 'shares',      label: 'Shares',       Icon: Share2,            color: 'text-violet-400' },
  { key: 'comments',    label: 'Comments',     Icon: MessageCircle,     color: 'text-amber-400' },
  { key: 'impressions', label: 'Impressions',  Icon: Eye,               color: 'text-emerald-400' },
  { key: 'clicks',      label: 'Clicks',       Icon: MousePointerClick, color: 'text-cyan-400' },
];

function MetricChip({ icon: Icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[52px]">
      <Icon className={cn('h-3.5 w-3.5', color)} />
      <span className="text-sm font-bold text-white">{value?.toLocaleString() ?? '—'}</span>
      <span className="text-[9px] text-zinc-600 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function AggregateSummary({ posts }) {
  const published = posts.filter(p => p.status === 'published' && p.analytics);

  const totals = METRICS.reduce((acc, m) => {
    acc[m.key] = published.reduce((s, p) => s + (p.analytics?.[m.key] ?? 0), 0);
    return acc;
  }, {});

  const byPlatform = Object.entries(PLATFORM_META).map(([pid, meta]) => {
    const platformPosts = published.filter(p => p.platform === pid);
    return {
      name: meta.label,
      likes: platformPosts.reduce((s, p) => s + (p.analytics?.likes ?? 0), 0),
      shares: platformPosts.reduce((s, p) => s + (p.analytics?.shares ?? 0), 0),
      comments: platformPosts.reduce((s, p) => s + (p.analytics?.comments ?? 0), 0),
      color: meta.chartColor,
    };
  }).filter(d => d.likes + d.shares + d.comments > 0);

  if (published.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-violet-400" />
        <p className="text-xs font-semibold text-zinc-200">Aggregate Performance</p>
        <Badge className="bg-zinc-800 text-zinc-400 border-0 text-[10px]">{published.length} post{published.length !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Totals row */}
      <div className="flex gap-4 flex-wrap bg-zinc-800/40 border border-zinc-700 rounded-xl px-4 py-3">
        {METRICS.map(m => (
          <MetricChip key={m.key} icon={m.Icon} label={m.label} value={totals[m.key]} color={m.color} />
        ))}
      </div>

      {/* Bar chart by platform */}
      {byPlatform.length > 0 && (
        <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-3">
          <p className="text-[10px] text-zinc-500 mb-2 flex items-center gap-1">
            <BarChart2 className="h-3 w-3" /> Engagement by Platform
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={byPlatform} barSize={18} barGap={4}>
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#e4e4e7' }}
                itemStyle={{ color: '#a1a1aa' }}
              />
              <Bar dataKey="likes" name="Likes" stackId="a" radius={[0, 0, 0, 0]}>
                {byPlatform.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.9} />)}
              </Bar>
              <Bar dataKey="shares" name="Shares" stackId="a">
                {byPlatform.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.6} />)}
              </Bar>
              <Bar dataKey="comments" name="Comments" stackId="a" radius={[3, 3, 0, 0]}>
                {byPlatform.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.35} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// Simulate fetching analytics from a platform API
async function fetchMockAnalytics(post) {
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
  // In production, call the real platform API here
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

function PostAnalyticsCard({ post, onRefresh }) {
  const meta = PLATFORM_META[post.platform];
  const { Icon, label, color, bg, border } = meta;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh(post);
    setRefreshing(false);
  };

  const a = post.analytics;
  const timeAgo = post.published_at
    ? format(new Date(post.published_at), 'MMM d, yyyy')
    : post.scheduled_at
      ? format(new Date(post.scheduled_at), 'MMM d, yyyy')
      : null;

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', bg, border)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn('h-4 w-4 shrink-0', color)} />
          <span className={cn('text-xs font-semibold', color)}>{label}</span>
          {post.account_handle && (
            <span className="text-[10px] text-zinc-500">@{post.account_handle}</span>
          )}
          {timeAgo && (
            <span className="text-[10px] text-zinc-600 flex items-center gap-1">
              <CalendarClock className="h-2.5 w-2.5" />{timeAgo}
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh metrics"
          className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
        </button>
      </div>

      {/* Post excerpt */}
      <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">{post.draft}</p>

      {/* Metrics */}
      {a ? (
        <>
          <div className="flex gap-4 flex-wrap pt-1">
            {METRICS.map(m => (
              <MetricChip key={m.key} icon={m.Icon} label={m.label} value={a[m.key]} color={m.color} />
            ))}
          </div>
          {a.last_fetched && (
            <p className="text-[9px] text-zinc-700">
              Last updated {format(new Date(a.last_fetched), 'MMM d, h:mm a')}
            </p>
          )}
        </>
      ) : (
        <p className="text-[10px] text-zinc-600 italic">No metrics yet — click refresh to fetch.</p>
      )}
    </div>
  );
}

export default function SocialAnalytics() {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['scheduled_posts'],
    queryFn: () => base44.entities.ScheduledPost.list('-scheduled_at', 50),
  });

  const published = posts.filter(p => p.status === 'published');
  const scheduled = posts.filter(p => p.status === 'scheduled');

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScheduledPost.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled_posts'] }),
  });

  const handleRefreshAll = async () => {
    const targets = published;
    if (!targets.length) { toast.info('No published posts to refresh'); return; }
    toast.info(`Fetching metrics for ${targets.length} posts…`);
    await Promise.all(targets.map(async (post) => {
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

  // Demo: mark scheduled posts as published so there's something to see
  const handleMarkPublished = async (post) => {
    const analytics = await fetchMockAnalytics(post);
    await updateMutation.mutateAsync({
      id: post.id,
      data: {
        status: 'published',
        published_at: new Date().toISOString(),
        platform_post_id: `mock_${Math.random().toString(36).slice(2, 10)}`,
        analytics,
      }
    });
    toast.success('Marked as published with sample metrics');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-600">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading posts…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Aggregate */}
      <AggregateSummary posts={posts} />

      {/* Published posts */}
      {published.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5 text-violet-400" /> Published Posts
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshAll}
              className="h-7 text-[10px] text-zinc-500 hover:text-white px-2"
            >
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

      {/* Scheduled (upcoming) */}
      {scheduled.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500">Upcoming Scheduled Posts</p>
          {scheduled.map(post => {
            const meta = PLATFORM_META[post.platform];
            const { Icon, label, color, bg, border } = meta;
            return (
              <div key={post.id} className={cn('rounded-xl border p-3 flex items-center justify-between gap-3', bg, border)}>
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />
                  <span className={cn('text-xs font-medium', color)}>{label}</span>
                  <p className="text-xs text-zinc-400 truncate">{post.draft?.slice(0, 60)}…</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-zinc-500">
                    {post.scheduled_at ? format(new Date(post.scheduled_at), 'MMM d, h:mm a') : ''}
                  </span>
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] px-1.5">scheduled</Badge>
                  <button
                    onClick={() => handleMarkPublished(post)}
                    className="text-[9px] text-zinc-600 hover:text-emerald-400 transition-colors whitespace-nowrap"
                    title="Simulate publishing (demo)"
                  >
                    Simulate publish
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-10 text-zinc-600">
          <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">No posts yet. Schedule some posts from the Compose tab.</p>
        </div>
      )}
    </div>
  );
}