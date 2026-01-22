import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const colorOptions = [
  { name: 'Violet', value: 'bg-violet-500' },
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Emerald', value: 'bg-emerald-500' },
  { name: 'Amber', value: 'bg-amber-500' },
  { name: 'Rose', value: 'bg-rose-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
];

const DEFAULT_LIVING_SUMMARY = `## Objective
(Define the primary goal or purpose of this vault)

## Key Facts
- (Add important facts and context here)

## Decisions
- (Record decisions made during sessions)

## Open Questions
- (List unresolved questions to explore)

## Next Actions
- (Track actionable next steps)`;

export default function CreateVaultModal({ open, onOpenChange, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('bg-violet-500');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setIsCreating(true);
    await onCreate({
      name: name.trim(),
      description: description.trim(),
      color,
      living_summary: DEFAULT_LIVING_SUMMARY,
      live_insights_level: 'off',
      auto_accept_synthesis: false,
      last_accessed: new Date().toISOString()
    });
    setIsCreating(false);
    setName('');
    setDescription('');
    setColor('bg-violet-500');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <FolderPlus className="h-5 w-5 text-violet-400" />
            Create Context Vault
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">Vault Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Product Strategy, Research Notes..."
              className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-600 h-11"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this vault's purpose..."
              className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-600 resize-none h-20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">Color</Label>
            <div className="flex gap-2">
              {colorOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setColor(opt.value)}
                  className={cn(
                    "h-8 w-8 rounded-lg transition-all",
                    opt.value,
                    color === opt.value 
                      ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" 
                      : "opacity-60 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-400">
                  Your vault will be initialized with a structured Living Summary template. 
                  This memory grows and refines over time through your sessions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white"
            >
              {isCreating ? 'Creating...' : 'Create Vault'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}