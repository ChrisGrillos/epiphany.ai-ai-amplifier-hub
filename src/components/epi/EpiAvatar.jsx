import React from 'react';
import { cn } from '@/lib/utils';

export default function EpiAvatar({ onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative h-16 w-16 rounded-full overflow-hidden",
        "hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-110",
        "transition-all duration-300 ease-out",
        "border-2 border-violet-400/30 hover:border-violet-400/60",
        className
      )}
      aria-label="Open Epi Settings"
    >
      {/* Avatar Image */}
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6972678b2088508d2d95b4e6/312428a4e_ChatGPTImageJan22202604_55_53PM.png"
        alt="Epi Avatar"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Animated glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/30 to-transparent animate-pulse" />
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-radial from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Status indicator */}
      <div className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-zinc-900 shadow-lg animate-pulse" />
    </button>
  );
}