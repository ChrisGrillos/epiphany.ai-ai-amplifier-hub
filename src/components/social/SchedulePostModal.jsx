import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Calendar, Clock, X, Send, CheckCircle2, Twitter, Linkedin, Instagram } from 'lucide-react';

const PLATFORM_META = {
  twitter:   { label: 'X / Twitter', Icon: Twitter,   color: 'text-sky-400',  bg: 'bg-sky-500/10',   border: 'border-sky-500/30' },
  linkedin:  { label: 'LinkedIn',    Icon: Linkedin,   color: 'text-blue-400', bg: 'bg-blue-500/10',  border: 'border-blue-500/30' },
  instagram: { label: 'Instagram',   Icon: Instagram,  color: 'text-pink-400', bg: 'bg-pink-500/10',  border: 'border-pink-500/30' },
};

export default function SchedulePostModal({ platform, draft, hashtags, vault, accountHandle, tone, onClose, onScheduled }) {
  const meta = PLATFORM_META[platform];
  const { Icon, label, color, bg, border } = meta;

  // Default: tomorrow 9am
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const pad = n => String(n).padStart(2, '0');
  const localISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const [scheduledAt, setScheduledAt] = useState(localISO(tomorrow));
  const [editedDraft, setEditedDraft] = useState(`${draft}\n\n${hashtags?.map(h => `#${h}`).join(' ')}`);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSchedule = async () => {
    if (!scheduledAt) { toast.error('Pick a date and time'); return; }
    setSaving(true);
    try {
      await base44.entities.ScheduledPost.create({
        platform,
        draft: editedDraft,
        hashtags,
        scheduled_at: new Date(scheduledAt).toISOString(),
        status: 'scheduled',
        vault_id: vault?.id || null,
        account_handle: accountHandle || null,
        tone,
      });
      setDone(true);
      toast.success(`Post scheduled for ${new Date(scheduledAt).toLocaleString()}`);
      setTimeout(() => { onScheduled?.(); onClose(); }, 1200);
    } catch {
      toast.error('Failed to schedule post');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-[440px] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', color)} />
            <span className="text-sm font-semibold text-white">Schedule for {label}</span>
            {accountHandle && (
              <Badge className={cn('text-[10px] px-1.5 py-0.5', bg, color, 'border-0')}>@{accountHandle}</Badge>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Post editor */}
        <div>
          <label className="text-[10px] text-zinc-500 mb-1 block">Edit post before scheduling</label>
          <textarea
            value={editedDraft}
            onChange={e => setEditedDraft(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white p-3 resize-none min-h-[120px] outline-none focus:border-violet-500 transition-colors"
          />
          <p className="text-[10px] text-zinc-600 mt-1">{editedDraft.length} chars</p>
        </div>

        {/* Date/Time */}
        <div>
          <label className="text-[10px] text-zinc-500 mb-1.5 block flex items-center gap-1.5">
            <Calendar className="h-3 w-3" /> Scheduled Date & Time
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            min={localISO(new Date())}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white px-3 py-2 outline-none focus:border-violet-500 transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Quick time shortcuts */}
        <div>
          <p className="text-[10px] text-zinc-600 mb-1.5">Quick picks</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'In 1h',      hours: 1 },
              { label: 'Tonight 8pm', fn: () => { const d=new Date(); d.setHours(20,0,0,0); return d; } },
              { label: 'Tomorrow 9am', fn: () => tomorrow },
              { label: 'Next Monday 9am', fn: () => {
                const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); d.setHours(9,0,0,0); return d;
              }},
            ].map(opt => (
              <button
                key={opt.label}
                onClick={() => {
                  const d = opt.fn ? opt.fn() : new Date(Date.now() + opt.hours * 3600000);
                  setScheduledAt(localISO(d));
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                <Clock className="h-2.5 w-2.5 inline mr-1" />{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-700 text-zinc-400 h-9">
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={saving || done}
            className="flex-1 bg-violet-600 hover:bg-violet-500 h-9"
          >
            {done
              ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Scheduled!</>
              : saving
                ? <><span className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Saving…</>
                : <><Send className="h-4 w-4 mr-2" /> Schedule Post</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}