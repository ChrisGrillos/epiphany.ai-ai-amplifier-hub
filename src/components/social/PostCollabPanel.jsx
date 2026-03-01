import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  MessageSquare, CheckCircle2, XCircle, UserCheck, Clock,
  Send, Activity, ChevronDown, ChevronUp, User
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const APPROVAL_STYLES = {
  pending:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function PostCollabPanel({ post }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState(post.assigned_to || '');
  const [saving, setSaving] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const logActivity = (post, action, detail) => {
    const entry = {
      id: Math.random().toString(36).slice(2),
      actor_email: user?.email || 'unknown',
      actor_name: user?.full_name || user?.email || 'Unknown',
      action,
      detail,
      timestamp: new Date().toISOString(),
    };
    return [...(post.activity_log || []), entry];
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSaving(true);
    const comment = {
      id: Math.random().toString(36).slice(2),
      author_email: user?.email || 'unknown',
      author_name: user?.full_name || user?.email || 'Unknown',
      text: commentText.trim(),
      timestamp: new Date().toISOString(),
    };
    const updatedComments = [...(post.comments || []), comment];
    const updatedLog = logActivity(post, 'commented', commentText.trim().slice(0, 60));
    await base44.entities.ScheduledPost.update(post.id, {
      comments: updatedComments,
      activity_log: updatedLog,
    });
    queryClient.invalidateQueries({ queryKey: ['scheduled_posts'] });
    setCommentText('');
    toast.success('Comment added');
    setSaving(false);
  };

  const handleAssign = async () => {
    if (!assigneeEmail.trim()) return;
    setSaving(true);
    const updatedLog = logActivity(post, 'assigned', `Assigned to ${assigneeEmail}`);
    await base44.entities.ScheduledPost.update(post.id, {
      assigned_to: assigneeEmail.trim(),
      approval_status: 'pending',
      activity_log: updatedLog,
    });
    queryClient.invalidateQueries({ queryKey: ['scheduled_posts'] });
    toast.success(`Assigned to ${assigneeEmail}`);
    setSaving(false);
  };

  const handleApproval = async (status) => {
    setSaving(true);
    const updatedLog = logActivity(post, status === 'approved' ? 'approved' : 'rejected', '');
    await base44.entities.ScheduledPost.update(post.id, {
      approval_status: status,
      activity_log: updatedLog,
    });
    queryClient.invalidateQueries({ queryKey: ['scheduled_posts'] });
    toast.success(`Post ${status}`);
    setSaving(false);
  };

  return (
    <div className="border-t border-zinc-800 mt-2 pt-3 space-y-3">

      {/* Assignment Row */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 justify-between flex-wrap">
          <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
            <UserCheck className="h-3 w-3" /> Assigned Reviewer
          </span>
          {post.approval_status && (
            <Badge className={cn('text-[9px] px-1.5 py-0', APPROVAL_STYLES[post.approval_status])}>
              {post.approval_status}
            </Badge>
          )}
        </div>
        <div className="flex gap-1.5">
          <input
            type="email"
            value={assigneeEmail}
            onChange={e => setAssigneeEmail(e.target.value)}
            placeholder="team@example.com"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-violet-500 transition-colors"
          />
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={saving || !assigneeEmail.trim()}
            className="h-7 px-2.5 text-[10px] bg-violet-600 hover:bg-violet-500"
          >
            Assign
          </Button>
        </div>
        {post.assigned_to && (
          <p className="text-[10px] text-zinc-600 flex items-center gap-1">
            <User className="h-2.5 w-2.5" /> Currently: {post.assigned_to}
          </p>
        )}
        {/* Approve / Reject buttons for assigned reviewer */}
        {post.assigned_to && post.approval_status === 'pending' && (
          <div className="flex gap-1.5 mt-1">
            <Button
              size="sm"
              onClick={() => handleApproval('approved')}
              disabled={saving}
              className="h-7 px-2.5 text-[10px] bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30"
              variant="ghost"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
            </Button>
            <Button
              size="sm"
              onClick={() => handleApproval('rejected')}
              disabled={saving}
              className="h-7 px-2.5 text-[10px] bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30"
              variant="ghost"
            >
              <XCircle className="h-3 w-3 mr-1" /> Reject
            </Button>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
          <MessageSquare className="h-3 w-3" /> Comments ({(post.comments || []).length})
        </span>
        {(post.comments || []).length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {(post.comments || []).map(c => (
              <div key={c.id} className="bg-zinc-800/60 rounded-lg px-2.5 py-2 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-zinc-300">{c.author_name}</span>
                  <span className="text-[9px] text-zinc-600">
                    {c.timestamp ? formatDistanceToNow(parseISO(c.timestamp), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-1.5 items-end">
          <Textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Leave feedback on this draft…"
            className="bg-zinc-800 border-zinc-700 text-white text-xs resize-none min-h-[52px] flex-1"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment(); }}
          />
          <Button
            size="sm"
            onClick={handleAddComment}
            disabled={saving || !commentText.trim()}
            className="h-9 w-9 p-0 bg-violet-600 hover:bg-violet-500 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Activity Log */}
      {(post.activity_log || []).length > 0 && (
        <div>
          <button
            onClick={() => setShowActivity(v => !v)}
            className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <Activity className="h-3 w-3" />
            Activity Log ({post.activity_log.length})
            {showActivity ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showActivity && (
            <div className="mt-1.5 space-y-1 border-l-2 border-zinc-800 pl-3 max-h-40 overflow-y-auto">
              {[...post.activity_log].reverse().map(entry => (
                <div key={entry.id} className="flex items-start gap-2">
                  <Clock className="h-2.5 w-2.5 text-zinc-700 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-zinc-400">
                      <span className="text-zinc-300">{entry.actor_name}</span>{' '}
                      <span className="capitalize">{entry.action}</span>
                      {entry.detail ? ` — "${entry.detail.slice(0, 40)}${entry.detail.length > 40 ? '…' : ''}"` : ''}
                    </span>
                    <p className="text-[9px] text-zinc-700">
                      {entry.timestamp ? formatDistanceToNow(parseISO(entry.timestamp), { addSuffix: true }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}