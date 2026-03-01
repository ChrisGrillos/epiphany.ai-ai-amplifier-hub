import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Twitter, Linkedin, Instagram, Loader2, CalendarClock,
  LayoutList, Filter, RefreshCw, AlertTriangle, CalendarDays
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import PostQueueItem from './PostQueueItem';
import RescheduleModal from './RescheduleModal';
import PostCalendar from './PostCalendar';

const PLATFORM_FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'twitter',   label: 'X',         Icon: Twitter,   color: 'text-sky-400' },
  { id: 'linkedin',  label: 'LinkedIn',   Icon: Linkedin,  color: 'text-blue-400' },
  { id: 'instagram', label: 'Instagram',  Icon: Instagram, color: 'text-pink-400' },
];

const STATUS_FILTERS = ['scheduled', 'published', 'failed', 'cancelled'];

export default function PostQueue() {
  const queryClient = useQueryClient();
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('scheduled');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'calendar'

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['scheduled_posts'],
    queryFn: () => base44.entities.ScheduledPost.list('scheduled_at', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScheduledPost.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled_posts'] }),
  });

  const filtered = posts.filter(p => {
    const matchPlatform = platformFilter === 'all' || p.platform === platformFilter;
    const matchStatus   = p.status === statusFilter;
    return matchPlatform && matchStatus;
  });

  // Move a post up/down in the filtered list (adjusts scheduled_at by 1 min swap)
  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const above = filtered[index - 1];
    const current = filtered[index];
    // Swap scheduled_at times
    await Promise.all([
      updateMutation.mutateAsync({ id: current.id, data: { scheduled_at: above.scheduled_at } }),
      updateMutation.mutateAsync({ id: above.id,   data: { scheduled_at: current.scheduled_at } }),
    ]);
    toast.success('Order updated');
  };

  const handleMoveDown = async (index) => {
    if (index >= filtered.length - 1) return;
    const below = filtered[index + 1];
    const current = filtered[index];
    await Promise.all([
      updateMutation.mutateAsync({ id: current.id, data: { scheduled_at: below.scheduled_at } }),
      updateMutation.mutateAsync({ id: below.id,   data: { scheduled_at: current.scheduled_at } }),
    ]);
    toast.success('Order updated');
  };

  const handleCancel = async (post) => {
    await updateMutation.mutateAsync({ id: post.id, data: { status: 'cancelled' } });
    toast.success('Post cancelled');
  };

  const handleMarkPublished = async (post) => {
    await updateMutation.mutateAsync({
      id: post.id,
      data: {
        status: 'published',
        published_at: new Date().toISOString(),
        platform_post_id: `mock_${Math.random().toString(36).slice(2, 10)}`,
      }
    });
    toast.success('Marked as published');
  };

  // Status counts for tabs
  const countByStatus = STATUS_FILTERS.reduce((acc, s) => {
    acc[s] = posts.filter(p => p.status === s && (platformFilter === 'all' || p.platform === platformFilter)).length;
    return acc;
  }, {});

  // Overdue posts
  const overdue = filtered.filter(p => p.status === 'scheduled' && p.scheduled_at && parseISO(p.scheduled_at) < new Date());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-600">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading queue…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutList className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">Post Queue</span>
          <Badge className="bg-zinc-800 text-zinc-400 border-0 text-[10px]">
            {posts.length} total
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {/* View toggle */}
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={cn('flex items-center gap-1 px-2.5 py-1.5 text-[10px] transition-colors', view === 'list' ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300')}
            >
              <LayoutList className="h-3 w-3" /> List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn('flex items-center gap-1 px-2.5 py-1.5 text-[10px] transition-colors', view === 'calendar' ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300')}
            >
              <CalendarDays className="h-3 w-3" /> Calendar
            </button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['scheduled_posts'] })}
            className="h-7 text-[10px] text-zinc-500 hover:text-white px-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Platform filter */}
      <div className="flex gap-1.5 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-zinc-600 self-center" />
        {PLATFORM_FILTERS.map(f => {
          const Icon = f.Icon;
          return (
            <button
              key={f.id}
              onClick={() => setPlatformFilter(f.id)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] transition-colors',
                platformFilter === f.id
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:text-zinc-300'
              )}
            >
              {Icon && <Icon className={cn('h-3 w-3', platformFilter === f.id ? 'text-violet-300' : f.color)} />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Status tabs */}
      <div className="flex gap-0 border-b border-zinc-800">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors capitalize',
              statusFilter === s
                ? 'text-violet-400 border-violet-500'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            )}
          >
            {s}
            {countByStatus[s] > 0 && (
              <span className={cn(
                'text-[9px] px-1.5 py-0.5 rounded-full',
                s === 'scheduled' ? 'bg-amber-500/20 text-amber-400' :
                s === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                s === 'failed'    ? 'bg-red-500/20 text-red-400' :
                'bg-zinc-700/40 text-zinc-500'
              )}>
                {countByStatus[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CALENDAR VIEW ── */}
      {view === 'calendar' && (
        <PostCalendar
          posts={posts}
          onReschedule={async (post, newTimeISO) => {
            await updateMutation.mutateAsync({ id: post.id, data: { scheduled_at: newTimeISO } });
            toast.success('Post rescheduled');
          }}
        />
      )}

      {view === 'list' && (
      <React.Fragment>
      {/* Overdue warning */}
      {statusFilter === 'scheduled' && overdue.length > 0 && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">
            {overdue.length} post{overdue.length !== 1 ? 's are' : ' is'} overdue for publishing.
          </p>
        </div>
      )}

      {/* Queue list */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {statusFilter === 'scheduled' && (
            <p className="text-[10px] text-zinc-600 flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              Sorted by scheduled time · Use ↑↓ to reorder
            </p>
          )}
          {filtered.map((post, index) => (
            <PostQueueItem
              key={post.id}
              post={post}
              index={index}
              total={filtered.length}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onCancel={handleCancel}
              onReschedule={setRescheduleTarget}
              onMarkPublished={handleMarkPublished}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-zinc-600">
          <LayoutList className="h-7 w-7 mx-auto mb-2 opacity-30" />
          <p className="text-xs">No {statusFilter} posts{platformFilter !== 'all' ? ` for ${platformFilter}` : ''}.</p>
          {statusFilter === 'scheduled' && (
            <p className="text-[10px] text-zinc-700 mt-1">Create posts from the Compose tab.</p>
          )}
        </div>
      )}

      {/* Reschedule modal */}
      {rescheduleTarget && (
        <RescheduleModal
          post={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSave={async (newTime) => {
            await updateMutation.mutateAsync({
              id: rescheduleTarget.id,
              data: { scheduled_at: new Date(newTime).toISOString() }
            });
            toast.success('Post rescheduled');
            setRescheduleTarget(null);
          }}
        />
      )}
      </>}
    </div>
  );
}