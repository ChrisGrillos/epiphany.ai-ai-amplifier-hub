import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Twitter, Linkedin, Instagram, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, addMonths, subMonths, setHours, setMinutes } from 'date-fns';
import RescheduleModal from './RescheduleModal';

const PLATFORM_META = {
  twitter:   { label: 'X',         Icon: Twitter,   dot: 'bg-sky-400',   chip: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  linkedin:  { label: 'LinkedIn',  Icon: Linkedin,  dot: 'bg-blue-400',  chip: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  instagram: { label: 'Instagram', Icon: Instagram, dot: 'bg-pink-400',  chip: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
};

function PostChip({ post, onDragStart, onClick }) {
  const meta = PLATFORM_META[post.platform] || PLATFORM_META.twitter;
  const { Icon, chip } = meta;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('postId', post.id);
        onDragStart(post.id);
      }}
      onClick={() => onClick(post)}
      className={cn(
        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border cursor-grab active:cursor-grabbing truncate select-none hover:brightness-110 transition-all',
        chip
      )}
      title={post.draft}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" />
      <span className="truncate">{post.draft?.slice(0, 28)}{post.draft?.length > 28 ? '…' : ''}</span>
    </div>
  );
}

function DayCell({ date, posts, isCurrentMonth, isToday, onDrop, onDragOver, onDragStart, onPostClick }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
    onDragOver();
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const postId = e.dataTransfer.getData('postId');
    if (postId) onDrop(postId, date);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'min-h-[90px] p-1.5 border-b border-r border-zinc-800 transition-colors',
        !isCurrentMonth && 'opacity-30',
        isToday && 'bg-violet-500/5',
        dragOver && 'bg-violet-500/15 border-violet-500/50',
      )}
    >
      <div className={cn(
        'text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full mb-1 mx-auto',
        isToday ? 'bg-violet-500 text-white' : 'text-zinc-500'
      )}>
        {format(date, 'd')}
      </div>
      <div className="space-y-0.5">
        {posts.slice(0, 3).map(post => (
          <PostChip key={post.id} post={post} onDragStart={onDragStart} onClick={onPostClick} />
        ))}
        {posts.length > 3 && (
          <div className="text-[9px] text-zinc-600 pl-1">+{posts.length - 3} more</div>
        )}
      </div>
    </div>
  );
}

export default function PostCalendar({ posts, onReschedule }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggingId, setDraggingId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const today = new Date();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  // Build grid of weeks
  const weeks = [];
  let day = calStart;
  while (day <= calEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  // Map posts by date string
  const postsByDay = {};
  posts.forEach(post => {
    if (!post.scheduled_at) return;
    const key = format(parseISO(post.scheduled_at), 'yyyy-MM-dd');
    if (!postsByDay[key]) postsByDay[key] = [];
    postsByDay[key].push(post);
  });

  const handleDrop = (postId, targetDate) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    // Preserve original time, just change the date
    const original = post.scheduled_at ? parseISO(post.scheduled_at) : new Date();
    const newDate = setMinutes(setHours(targetDate, original.getHours()), original.getMinutes());
    onReschedule(post, newDate.toISOString());
    setDraggingId(null);
  };

  const scheduledPosts = posts.filter(p => p.status === 'scheduled');

  // Legend
  const platforms = Object.entries(PLATFORM_META);

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">{format(currentMonth, 'MMMM yyyy')}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Legend */}
          <div className="flex items-center gap-2 mr-3">
            {platforms.map(([id, meta]) => (
              <div key={id} className="flex items-center gap-1">
                <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
                <span className="text-[10px] text-zinc-500">{meta.label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="h-7 w-7 flex items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-2 h-7 text-[10px] text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="h-7 w-7 flex items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/60">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-[10px] text-zinc-600 font-medium text-center py-2 border-r border-zinc-800 last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((date, di) => {
              const key = format(date, 'yyyy-MM-dd');
              const dayPosts = (postsByDay[key] || []).filter(p => p.status === 'scheduled');
              return (
                <DayCell
                  key={key}
                  date={date}
                  posts={dayPosts}
                  isCurrentMonth={isSameMonth(date, currentMonth)}
                  isToday={isSameDay(date, today)}
                  onDrop={handleDrop}
                  onDragOver={() => {}}
                  onDragStart={setDraggingId}
                  onPostClick={setSelectedPost}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[10px] text-zinc-600">
        <span>{scheduledPosts.filter(p => {
          const d = p.scheduled_at ? parseISO(p.scheduled_at) : null;
          return d && isSameMonth(d, currentMonth);
        }).length} posts scheduled this month</span>
        <span>·</span>
        <span>Drag posts between days to reschedule</span>
      </div>

      {/* Post detail / reschedule modal on click */}
      {selectedPost && (
        <RescheduleModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onSave={(newTime) => {
            onReschedule(selectedPost, new Date(newTime).toISOString());
            setSelectedPost(null);
          }}
        />
      )}
    </div>
  );
}