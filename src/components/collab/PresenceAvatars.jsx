import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const COLORS = [
  'bg-violet-500', 'bg-sky-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-pink-500', 'bg-orange-500',
];

function getColor(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name, email) {
  if (name) return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export default function PresenceAvatars({ vaultId }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!vaultId) return;

    // Heartbeat: mark self as present
    const heartbeat = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const existing = await base44.entities.VaultMember.filter({ vault_id: vaultId, user_email: user.email });
        if (existing.length > 0) {
          await base44.entities.VaultMember.update(existing[0].id, { last_seen: new Date().toISOString() });
        }
      } catch {}
    };

    heartbeat();
    const interval = setInterval(heartbeat, 30000);

    // Subscribe to member changes for presence
    const unsubscribe = base44.entities.VaultMember.subscribe((event) => {
      if (event.data?.vault_id !== vaultId) return;
      loadPresent();
    });

    const loadPresent = async () => {
      try {
        const all = await base44.entities.VaultMember.filter({ vault_id: vaultId });
        const cutoff = new Date(Date.now() - 2 * 60 * 1000); // 2 min window
        setMembers(all.filter(m => m.last_seen && new Date(m.last_seen) > cutoff));
      } catch {}
    };

    loadPresent();

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [vaultId]);

  if (members.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {members.slice(0, 5).map((m) => (
          <Tooltip key={m.id}>
            <TooltipTrigger asChild>
              <div className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-zinc-900 cursor-default',
                getColor(m.user_email)
              )}>
                {initials(m.user_name, m.user_email)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700 text-xs">
              <p className="font-medium">{m.user_name || m.user_email}</p>
              <p className="text-zinc-400 capitalize">{m.role}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {members.length > 5 && (
          <div className="h-7 w-7 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-300 border-2 border-zinc-900">
            +{members.length - 5}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}