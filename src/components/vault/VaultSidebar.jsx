import React from 'react';
import { Plus, FolderOpen, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import moment from 'moment';

const vaultColors = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500'
];

export default function VaultSidebar({ 
  vaults, 
  activeVaultId, 
  onSelectVault, 
  onCreateVault,
  collapsed = false 
}) {
  const sortedVaults = [...(vaults || [])].sort((a, b) => 
    new Date(b.last_accessed || b.created_date) - new Date(a.last_accessed || a.created_date)
  );

  if (collapsed) {
    return (
      <div className="w-16 border-r border-zinc-800/50 bg-zinc-950/50 flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCreateVault}
          className="h-10 w-10 rounded-xl hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
        >
          <Plus className="h-5 w-5" />
        </Button>
        <div className="w-8 h-px bg-zinc-800 my-2" />
        {sortedVaults.slice(0, 6).map((vault, idx) => (
          <button
            key={vault.id}
            onClick={() => onSelectVault(vault)}
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all",
              activeVaultId === vault.id
                ? "bg-zinc-800 text-white ring-1 ring-zinc-700"
                : "hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-300"
            )}
          >
            <div className={cn(
              "h-6 w-6 rounded-lg flex items-center justify-center text-xs font-semibold text-white",
              vault.color || vaultColors[idx % vaultColors.length]
            )}>
              {vault.name?.charAt(0).toUpperCase()}
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-72 border-r border-zinc-800/50 bg-zinc-950/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight">Epiphany.AI</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">AI Amplifier Hub</p>
          </div>
        </div>
        <Button
          onClick={onCreateVault}
          className="w-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/50 h-9"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Context Vault
        </Button>
      </div>

      {/* Vault List */}
      <ScrollArea className="flex-1 px-2 py-3">
        <div className="space-y-1">
          {sortedVaults.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <FolderOpen className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-xs text-zinc-500">No vaults yet</p>
              <p className="text-[11px] text-zinc-600 mt-1">Create your first vault to begin</p>
            </div>
          ) : (
            sortedVaults.map((vault, idx) => (
              <button
                key={vault.id}
                onClick={() => onSelectVault(vault)}
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg text-left transition-all group",
                  activeVaultId === vault.id
                    ? "bg-zinc-800/80 ring-1 ring-zinc-700/50"
                    : "hover:bg-zinc-800/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold text-white shrink-0 mt-0.5",
                    vault.color || vaultColors[idx % vaultColors.length]
                  )}>
                    {vault.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={cn(
                        "text-sm font-medium truncate",
                        activeVaultId === vault.id ? "text-white" : "text-zinc-300"
                      )}>
                        {vault.name}
                      </h3>
                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform",
                        activeVaultId === vault.id 
                          ? "text-zinc-400" 
                          : "text-zinc-600 opacity-0 group-hover:opacity-100"
                      )} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="h-3 w-3 text-zinc-600" />
                      <span className="text-[11px] text-zinc-500">
                        {moment(vault.last_accessed || vault.created_date).fromNow()}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800/50">
        <p className="text-[10px] text-zinc-600 text-center">
          Memory that improves, never rots
        </p>
      </div>
    </div>
  );
}