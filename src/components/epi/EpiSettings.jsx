import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const EPI_LEVELS = [
  {
    level: 0,
    name: 'Off',
    subtitle: 'Manual Mode',
    description: 'Epi is disabled. No coordination, no suggestions, no assistance.',
    note: 'Best for users who want full manual control.',
    color: 'text-zinc-500'
  },
  {
    level: 1,
    name: 'Silent Concierge',
    subtitle: 'Behind-the-Scenes Only',
    description: 'Epi quietly organizes context, prepares AI inputs, and maintains consistency. No messages. No interruptions.',
    note: 'Recommended for most users.',
    color: 'text-blue-400',
    isDefault: true
  },
  {
    level: 2,
    name: 'Guided Concierge',
    subtitle: 'Light Guidance',
    description: 'Epi may ask brief clarifying questions, flag issues when you request a check, and confirm potentially destructive actions.',
    note: 'Still calm. Still optional.',
    color: 'text-emerald-400'
  },
  {
    level: 3,
    name: 'Conversational Concierge',
    subtitle: 'Context Bridge Mode',
    description: 'Epi becomes available to talk with you. Use this if you paste chats from other AIs, switch between AI tools, want help condensing or preparing context, or need clean copy-paste packs for external AI.',
    note: 'Epi coordinates — you decide.',
    color: 'text-violet-400'
  },
  {
    level: 4,
    name: 'Full Hub Concierge',
    subtitle: 'Maximum Assistance',
    description: 'Epi may speak proactively after key actions, suggest next steps, and flag inconsistencies automatically.',
    note: 'Never acts without approval. Best for complex projects and non-API workflows.',
    color: 'text-amber-400'
  }
];

export default function EpiSettings({ open, onOpenChange, epiLevel = 1, onLevelChange }) {
  const currentLevel = EPI_LEVELS[epiLevel];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Epi Involvement Level
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Control how much Epi participates in managing your workspace. You are always in control.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Level</Label>
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-bold", currentLevel.color)}>
                  {epiLevel}
                </span>
                {currentLevel.isDefault && (
                  <Badge className="bg-blue-500/20 text-blue-300 text-xs">Default</Badge>
                )}
              </div>
            </div>

            <Slider
              value={[epiLevel]}
              onValueChange={([value]) => onLevelChange(value)}
              max={4}
              step={1}
              className="py-4"
            />

            <div className="flex justify-between text-[10px] text-zinc-600 px-1">
              <span>Off</span>
              <span>Silent</span>
              <span>Guided</span>
              <span>Conversational</span>
              <span>Full</span>
            </div>
          </div>

          {/* Current Level Details */}
          <div className={cn(
            "rounded-lg border p-4 space-y-3",
            "bg-zinc-800/30 border-zinc-700/50"
          )}>
            <div className="flex items-center gap-2">
              <Sparkles className={cn("h-5 w-5", currentLevel.color)} />
              <div>
                <h3 className="text-white font-medium">{currentLevel.name}</h3>
                <p className="text-xs text-zinc-500">{currentLevel.subtitle}</p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              {currentLevel.description}
            </p>

            <div className="flex items-start gap-2 pt-2 border-t border-zinc-700/30">
              <Info className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
              <p className="text-xs text-zinc-500 leading-relaxed">
                {currentLevel.note}
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
            <p className="text-xs text-violet-300 leading-relaxed">
              <strong>Note:</strong> Epi never acts autonomously, rewrites your work without consent, 
              or sends data externally. You can change this level at any time.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}