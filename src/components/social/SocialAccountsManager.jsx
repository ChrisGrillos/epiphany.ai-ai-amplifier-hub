import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Twitter, Linkedin, Instagram, CheckCircle2, X, Loader2, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PLATFORM_META = {
  twitter:   { label: 'X / Twitter', Icon: Twitter,   color: 'text-sky-400',  bg: 'bg-sky-500/10',   border: 'border-sky-500/30',  storageKey: 'social_twitter_account' },
  linkedin:  { label: 'LinkedIn',    Icon: Linkedin,   color: 'text-blue-400', bg: 'bg-blue-500/10',  border: 'border-blue-500/30', storageKey: 'social_linkedin_account' },
  instagram: { label: 'Instagram',   Icon: Instagram,  color: 'text-pink-400', bg: 'bg-pink-500/10',  border: 'border-pink-500/30', storageKey: 'social_instagram_account' },
};

// In a real implementation these would kick off real OAuth flows.
// For now we simulate connecting by asking for a handle (username).
function ConnectModal({ platform, onConnect, onClose }) {
  const meta = PLATFORM_META[platform];
  const { Icon, label, color } = meta;
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!handle.trim()) return;
    setLoading(true);
    // Simulate OAuth handshake delay
    await new Promise(r => setTimeout(r, 900));
    onConnect(handle.trim().replace(/^@/, ''));
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', color)} />
            <span className="text-sm font-semibold text-white">Connect {label}</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-400">
          Enter your {label} handle to link your account. In production this would launch an OAuth flow.
        </p>
        <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
          <span className="text-zinc-500 text-sm">@</span>
          <input
            value={handle}
            onChange={e => setHandle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConnect()}
            placeholder={`your${platform}handle`}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1 border-zinc-700 text-zinc-400">Cancel</Button>
          <Button size="sm" onClick={handleConnect} disabled={loading || !handle.trim()} className="flex-1 bg-violet-600 hover:bg-violet-500">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Link2 className="h-3.5 w-3.5 mr-1.5" />Connect</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useSocialAccounts() {
  const [accounts, setAccounts] = useState({});

  useEffect(() => {
    const loaded = {};
    Object.entries(PLATFORM_META).forEach(([pid, meta]) => {
      const v = localStorage.getItem(meta.storageKey);
      if (v) loaded[pid] = v;
    });
    setAccounts(loaded);
  }, []);

  const connect = (platform, handle) => {
    localStorage.setItem(PLATFORM_META[platform].storageKey, handle);
    setAccounts(prev => ({ ...prev, [platform]: handle }));
    toast.success(`${PLATFORM_META[platform].label} connected as @${handle}`);
  };

  const disconnect = (platform) => {
    localStorage.removeItem(PLATFORM_META[platform].storageKey);
    setAccounts(prev => { const n = { ...prev }; delete n[platform]; return n; });
    toast.success(`${PLATFORM_META[platform].label} disconnected`);
  };

  return { accounts, connect, disconnect };
}

export default function SocialAccountsManager({ accounts, onConnect, onDisconnect }) {
  const [connecting, setConnecting] = useState(null);

  return (
    <>
      <div className="space-y-2">
        {Object.entries(PLATFORM_META).map(([pid, meta]) => {
          const { label, Icon, color, bg, border } = meta;
          const handle = accounts[pid];
          return (
            <div key={pid} className={cn('flex items-center justify-between px-3 py-2.5 rounded-xl border', handle ? cn(bg, border) : 'bg-zinc-800/40 border-zinc-700')}>
              <div className="flex items-center gap-2.5">
                <Icon className={cn('h-4 w-4', handle ? color : 'text-zinc-500')} />
                <div>
                  <p className={cn('text-xs font-medium', handle ? 'text-white' : 'text-zinc-400')}>{label}</p>
                  {handle && <p className="text-[10px] text-zinc-500">@{handle}</p>}
                </div>
              </div>
              {handle ? (
                <div className="flex items-center gap-2">
                  <Badge className={cn('text-[10px] px-1.5 py-0.5', bg, color, 'border-0')}>
                    <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Connected
                  </Badge>
                  <button onClick={() => onDisconnect(pid)} className="text-zinc-600 hover:text-red-400 transition-colors text-[10px]">
                    Disconnect
                  </button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setConnecting(pid)}
                  className="h-7 text-xs border-zinc-600 text-zinc-300 hover:bg-zinc-700">
                  <Link2 className="h-3 w-3 mr-1.5" /> Connect
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {connecting && (
        <ConnectModal
          platform={connecting}
          onConnect={(handle) => { onConnect(connecting, handle); setConnecting(null); }}
          onClose={() => setConnecting(null)}
        />
      )}
    </>
  );
}