import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EpiAvatar({ onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative h-16 w-16 rounded-full overflow-hidden",
        "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500",
        "hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-110",
        "transition-all duration-300 ease-out",
        "border-2 border-violet-400/30 hover:border-violet-400/60",
        className
      )}
      aria-label="Open Epi Settings"
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/50 to-transparent animate-pulse" />
      
      {/* Sparkle icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="h-7 w-7 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-radial from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Status indicator */}
      <div className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-zinc-900 shadow-lg" />
    </button>
  );
}