import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TutorialTooltip({ 
  title, 
  description, 
  children, 
  side = 'bottom',
  onDismiss,
  showDismiss = true,
  className 
}) {
  const [open, setOpen] = useState(false);

  const handleDismiss = () => {
    setOpen(false);
    if (onDismiss) onDismiss();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <button className={cn("text-violet-400 hover:text-violet-300 transition-colors", className)}>
            <HelpCircle className="h-4 w-4" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        side={side} 
        className="bg-zinc-900 border-violet-500/30 text-white w-80 shadow-xl"
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-semibold text-violet-400">{title}</h4>
            {showDismiss && (
              <button onClick={handleDismiss} className="text-zinc-500 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">{description}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}