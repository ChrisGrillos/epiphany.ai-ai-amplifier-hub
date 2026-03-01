import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, CheckCircle2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function VaultComments({ vaultId, targetType = 'vault', targetId = null }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!vaultId) return;
    loadComments();

    const unsubscribe = base44.entities.VaultComment.subscribe((event) => {
      if (event.data?.vault_id === vaultId) loadComments();
    });
    return unsubscribe;
  }, [vaultId, targetId]);

  const loadComments = async () => {
    try {
      const filter = { vault_id: vaultId, resolved: false };
      if (targetId) filter.target_id = targetId;
      if (targetType) filter.target_type = targetType;
      const data = await base44.entities.VaultComment.filter(filter, 'created_date', 50);
      setComments(data);
    } catch {}
  };

  const handlePost = async () => {
    if (!text.trim() || !user) return;
    setLoading(true);
    try {
      await base44.entities.VaultComment.create({
        vault_id: vaultId,
        target_type: targetType,
        target_id: targetId || vaultId,
        author_email: user.email,
        author_name: user.full_name || user.email,
        text: text.trim(),
      });
      setText('');
    } catch {
      toast.error('Failed to post comment');
    }
    setLoading(false);
  };

  const handleResolve = async (commentId) => {
    try {
      await base44.entities.VaultComment.update(commentId, { resolved: true });
      toast.success('Comment resolved');
    } catch {
      toast.error('Failed to resolve');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-violet-400" />
        <span className="text-sm font-medium text-white">Comments</span>
        {comments.length > 0 && (
          <Badge className="bg-violet-500/20 text-violet-300 border-0 text-[10px]">{comments.length}</Badge>
        )}
      </div>

      <ScrollArea className="max-h-64">
        <div className="space-y-3 pr-1">
          {comments.length === 0 && (
            <p className="text-xs text-zinc-500 italic">No comments yet. Be the first!</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-violet-600 flex items-center justify-center text-[9px] text-white font-bold">
                    {(c.author_name || c.author_email).slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-zinc-300">{c.author_name || c.author_email}</span>
                  <span className="text-[10px] text-zinc-600">
                    {formatDistanceToNow(new Date(c.created_date), { addSuffix: true })}
                  </span>
                </div>
                {user?.email === c.author_email || user?.role === 'admin' ? (
                  <button
                    onClick={() => handleResolve(c.id)}
                    className="text-zinc-600 hover:text-emerald-400 transition-colors"
                    title="Resolve"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
          placeholder="Add a comment…"
          className="bg-zinc-800 border-zinc-700 text-white text-xs resize-none min-h-[60px]"
          disabled={loading || !user}
        />
        <Button
          onClick={handlePost}
          disabled={!text.trim() || loading || !user}
          size="sm"
          className="bg-violet-600 hover:bg-violet-500 self-end px-3"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}