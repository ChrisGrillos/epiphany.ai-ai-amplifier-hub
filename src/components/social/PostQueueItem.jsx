import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Twitter, Linkedin, Instagram, CalendarClock, Pencil,
  X, ChevronUp, ChevronDown, CheckCircle2, GripVertical, Clock
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

const PLATFORM_META = {
  twitter:   { label: 'X / Twitter', Icon: Twitter,   color: 'text-sky-400',  bg: 'bg-sky-500/10',   border: 'border-sky-500/30' },
  linkedin:  { label: 'LinkedIn',    Icon: Linkedin,   color: 'text-blue-400', bg: 'bg-blue-500/10',  border: 'border-blue-500/30' },
  instagram: { label: 'Instagram',   Icon: Instagram,  color: 'text-pink-400', bg: 'bg-pink-500/10',  border: 'border-pink-500/30' },
};

const STATUS_STYLES = {
  scheduled:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  published:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed:     'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled:  'bg-zinc-700/40 text-zinc-500 border-zinc-600/20',
};

export default function PostQueueItem({
  post, index, total,
  onMoveUp, onMoveDown,
  onCancel, onReschedule, onMarkPublished,
  isDragging,
}) {
  const meta = PLATFORM_META[post.platform] || PLATFORM_META.twitter;
  const { Icon, label, color, bg, border } = meta;
  const [expanded, setExpanded] = useState(false);

  const scheduledDate = post.scheduled_at ? parseISO(post.scheduled_at) : null;
  const isPast = scheduledDate && scheduledDate < new Date();
  const isScheduled = post.status === 'scheduled';

  return (
    <div className={cn(
      'rounded-xl border transition-all',
      bg, border,
      isDragging && 'opacity-60 scale-[0.98]',
    )}>
      {/* Main row */}
      <div className="flex items-start gap-3 p-3">
        {/* Drag handle + order controls */}
        <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0">
          <GripVertical className="h-4 w-4 text-zinc-600 cursor-grab" />
          {isScheduled && (
            <>
              <button onClick={() => onMoveUp(index)} disabled={index === 0} className="text-zinc-700 hover:text-zinc-400 disabled:opacity-20 transition-colors">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onMoveDown(index)} disabled={index === total - 1} className="text-zinc-700 hover:text-zinc-400 disabled:opacity-20 transition-colors">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />
            <span className={cn('text-xs font-semibold', color)}>{label}</span>
            {post.account_handle && (
              <span className="text-[10px] text-zinc-500">@{post.account_handle}</span>
            )}
            <Badge className={cn('text-[9px] px-1.5 py-0', STATUS_STYLES[post.status])}>
              {post.status}
            </Badge>
            {scheduledDate && (
              <span className={cn(
                'flex items-center gap-1 text-[10px]',
                isPast && isScheduled ? 'text-red-400' : 'text-zinc-500'
              )}>
                <CalendarClock className="h-2.5 w-2.5" />
                {format(scheduledDate, 'MMM d, yyyy · h:mm a')}
                {isScheduled && (
                  <span className="text-zinc-600">
                    · {isPast ? 'overdue' : formatDistanceToNow(scheduledDate, { addSuffix: true })}
                  </span>
                )}
              </span>
            )}
          </div>

          <p className={cn('text-xs leading-relaxed text-zinc-300', !expanded && 'line-clamp-2')}>
            {post.draft}
          </p>

          {post.draft?.length > 120 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}

          {post.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {post.hashtags.map((h, i) => (
                <span key={i} className={cn('text-[9px] px-1.5 py-0.5 rounded bg-black/20', color)}>#{h}</span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {isScheduled && (
          <div className="flex flex-col gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReschedule(post)}
              className="h-7 px-2 text-[10px] text-zinc-500 hover:text-white"
              title="Reschedule"
            >
              <Pencil className="h-3 w-3 mr-1" /> Reschedule
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMarkPublished(post)}
              className="h-7 px-2 text-[10px] text-zinc-500 hover:text-emerald-400"
              title="Mark as published (demo)"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" /> Publish
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCancel(post)}
              className="h-7 px-2 text-[10px] text-zinc-500 hover:text-red-400"
              title="Cancel post"
            >
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}