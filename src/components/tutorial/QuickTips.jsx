import React from 'react';
import { Card } from '@/components/ui/card';
import { Lightbulb, Sparkles, Zap, BookOpen } from 'lucide-react';

const tips = [
  {
    icon: Sparkles,
    title: 'Use Epi for Context',
    description: 'Paste web chats into Epi tab to condense them into structured notes',
    color: 'text-violet-400'
  },
  {
    icon: Zap,
    title: 'Auto-Save Active',
    description: 'Sessions auto-save every 2 minutes. No need to worry about losing work',
    color: 'text-emerald-400'
  },
  {
    icon: BookOpen,
    title: 'Living Summary',
    description: 'Your summary evolves with each synthesis - durable insights persist',
    color: 'text-blue-400'
  }
];

export default function QuickTips({ onDismiss }) {
  return (
    <div className="fixed bottom-24 right-6 z-40 max-w-xs">
      <Card className="bg-zinc-900 border-violet-500/30 p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Quick Tips</h3>
          </div>
          <button onClick={onDismiss} className="text-zinc-500 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
        <div className="space-y-3">
          {tips.map((tip, idx) => (
            <div key={idx} className="flex gap-2">
              <tip.icon className={`h-4 w-4 ${tip.color} shrink-0 mt-0.5`} />
              <div>
                <p className="text-xs font-medium text-white">{tip.title}</p>
                <p className="text-xs text-zinc-400">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}