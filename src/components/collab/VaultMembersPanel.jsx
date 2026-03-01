import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPlus, Trash2, Crown, Pencil, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_META = {
  owner:  { icon: Crown,  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',  label: 'Owner' },
  editor: { icon: Pencil, color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30', label: 'Editor' },
  viewer: { icon: Eye,    color: 'text-sky-400',      bg: 'bg-sky-500/10',     border: 'border-sky-500/30',    label: 'Viewer' },
};

export default function VaultMembersPanel({ open, onOpenChange, vault }) {
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!vault?.id || !open) return;
    loadMembers();
    const unsub = base44.entities.VaultMember.subscribe((e) => {
      if (e.data?.vault_id === vault.id) loadMembers();
    });
    return unsub;
  }, [vault?.id, open]);

  const loadMembers = async () => {
    try {
      const data = await base44.entities.VaultMember.filter({ vault_id: vault.id });
      setMembers(data);
    } catch {}
  };

  const myRole = members.find(m => m.user_email === user?.email)?.role;
  const canManage = myRole === 'owner' || user?.role === 'admin';

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    try {
      const existing = members.find(m => m.user_email === inviteEmail.trim());
      if (existing) { toast.error('Already a member'); setLoading(false); return; }
      await base44.entities.VaultMember.create({
        vault_id: vault.id,
        user_email: inviteEmail.trim(),
        role: inviteRole,
        invited_by: user?.email,
      });
      setInviteEmail('');
      toast.success('Member invited');
    } catch {
      toast.error('Failed to invite');
    }
    setLoading(false);
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      await base44.entities.VaultMember.update(memberId, { role: newRole });
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleRemove = async (memberId) => {
    try {
      await base44.entities.VaultMember.delete(memberId);
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-violet-400" />
            Vault Members
            <span className="text-zinc-500 text-sm font-normal">— {vault?.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invite */}
          {canManage && (
            <div className="flex gap-2">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                placeholder="user@email.com"
                className="bg-zinc-800 border-zinc-700 text-white text-sm flex-1"
              />
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-28 bg-zinc-800 border-zinc-700 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="viewer" className="text-white text-xs">Viewer</SelectItem>
                  <SelectItem value="editor" className="text-white text-xs">Editor</SelectItem>
                  <SelectItem value="owner" className="text-white text-xs">Owner</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleInvite}
                disabled={loading || !inviteEmail.trim()}
                size="sm"
                className="bg-violet-600 hover:bg-violet-500 shrink-0"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}

          {/* Member List */}
          <ScrollArea className="max-h-72">
            <div className="space-y-2 pr-1">
              {members.length === 0 && (
                <p className="text-xs text-zinc-500 italic text-center py-4">No members yet. Invite someone!</p>
              )}
              {members.map((m) => {
                const meta = ROLE_META[m.role] || ROLE_META.viewer;
                const Icon = meta.icon;
                const isMe = m.user_email === user?.email;
                return (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/40">
                    <div className="h-8 w-8 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300">
                      {m.user_email.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{m.user_name || m.user_email}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{m.user_email}</p>
                    </div>
                    {canManage && !isMe ? (
                      <Select value={m.role} onValueChange={(r) => handleChangeRole(m.id, r)}>
                        <SelectTrigger className={`w-24 h-7 text-[10px] border ${meta.bg} ${meta.border} ${meta.color}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="viewer" className="text-white text-xs">Viewer</SelectItem>
                          <SelectItem value="editor" className="text-white text-xs">Editor</SelectItem>
                          <SelectItem value="owner" className="text-white text-xs">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`${meta.bg} ${meta.color} border ${meta.border} text-[10px] gap-1`}>
                        <Icon className="h-2.5 w-2.5" /> {meta.label}
                      </Badge>
                    )}
                    {canManage && !isMe && (
                      <button
                        onClick={() => handleRemove(m.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <p className="text-[10px] text-zinc-600 leading-relaxed">
            <span className="text-zinc-400 font-medium">Owners</span> can manage members.{' '}
            <span className="text-zinc-400 font-medium">Editors</span> can modify vault content.{' '}
            <span className="text-zinc-400 font-medium">Viewers</span> have read-only access.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}