import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, Clock, X, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const pad = n => String(n).padStart(2, '0');
const localISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const QUICK_PICKS = [
  { label: 'In 1h',         fn: () => new Date(Date.now() + 3600000) },
  { label: 'Tonight 8pm',   fn: () => { const d=new Date(); d.setHours(20,0,0,0); return d; } },
  { label: 'Tomorrow 9am',  fn: () => { const d=new Date(); d.setDate(d.getDate()+1); d.setHours(9,0,0,0); return d; } },
  { label: 'Next Mon 9am',  fn: () => { const d=new Date(); d.setDate(d.getDate()+((8-d.getDay())%7||7)); d.setHours(9,0,0,0); return d; } },
];

export default function RescheduleModal({ post, onClose, onSave }) {
  const current = post.scheduled_at ? localISO(parseISO(post.scheduled_at)) : localISO(new Date());
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!value) return;
    setSaving(true);
    await onSave(value);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-[380px] shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-semibold text-white">Reschedule Post</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Post preview */}
        <p className="text-xs text-zinc-400 bg-zinc-800 rounded-lg p-3 line-clamp-3">{post.draft}</p>

        {/* Current schedule */}
        <p className="text-[10px] text-zinc-600">
          Currently scheduled: <span className="text-zinc-400">{post.scheduled_at ? format(parseISO(post.scheduled_at), 'MMM d, yyyy · h:mm a') : '—'}</span>
        </p>

        {/* New datetime */}
        <div>
          <label className="text-[10px] text-zinc-500 mb-1.5 block flex items-center gap-1">
            <Clock className="h-3 w-3" /> New Date & Time
          </label>
          <input
            type="datetime-local"
            value={value}
            onChange={e => setValue(e.target.value)}
            min={localISO(new Date())}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white px-3 py-2 outline-none focus:border-violet-500 transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Quick picks */}
        <div>
          <p className="text-[10px] text-zinc-600 mb-1.5">Quick picks</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PICKS.map(opt => (
              <button
                key={opt.label}
                onClick={() => setValue(localISO(opt.fn()))}
                className="px-2.5 py-1 rounded-lg text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                <Clock className="h-2.5 w-2.5 inline mr-1" />{opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-700 text-zinc-400 h-9">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !value}
            className="flex-1 bg-violet-600 hover:bg-violet-500 h-9"
          >
            {saving
              ? <span className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              : <Save className="h-4 w-4 mr-2" />
            }
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}