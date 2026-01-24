import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Sparkles, 
  Settings2, 
  StopCircle,
  Zap,
  ChevronDown,
  FileText,
  Download,
  Shield,
  Calendar,
  Mail,
  MoreHorizontal,
  Copy,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const insightLevels = [
  { value: 'off', label: 'Off', desc: 'No external lookups' },
  { value: 'light', label: 'Light', desc: 'Open Questions only' },
  { value: 'medium', label: 'Medium', desc: 'Questions + Actions' },
  { value: 'heavy', label: 'Heavy', desc: 'Full summary scan' },
  { value: 'manual', label: 'Manual Only', desc: 'On-demand only' },
];

export default function SessionHeader({ 
  vault, 
  session,
  onEndSession, 
  onViewSummary,
  onUpdateInsights,
  onShowReferences,
  onShowImport,
  onShowExport,
  onShowGuardian,
  onShowCalendar,
  onShowEmail,
  onShowEpiChat,
  hasMessages,
  referencesCount = 0,
  onCopyLivingSummary,
  onCopySessionThread,
  onCopyContextPack,
  lastContextPack
}) {
  const currentLevel = insightLevels.find(l => l.value === vault?.live_insights_level) || insightLevels[0];

  return (
    <div className="h-14 border-b border-zinc-800/50 bg-zinc-950/50 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold text-white",
          vault?.color || 'bg-violet-500'
        )}>
          {vault?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-sm font-medium text-white">{vault?.name}</h2>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="h-5 text-[10px] border-zinc-700 text-zinc-400 font-normal"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              Living Summary loaded
            </Badge>
            {vault?.live_insights_level !== 'off' && (
              <Badge 
                variant="outline" 
                className="h-5 text-[10px] border-violet-500/30 text-violet-400 font-normal"
              >
                <Zap className="h-3 w-3 mr-1" />
                Insights: {currentLevel.label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* View Summary */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewSummary}
          className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <BookOpen className="h-4 w-4 mr-1.5" />
          <span className="text-xs">Summary</span>
        </Button>

        {/* References */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onShowReferences}
          className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800 relative"
        >
          <FileText className="h-4 w-4 mr-1.5" />
          <span className="text-xs">References</span>
          {referencesCount > 0 && (
            <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-blue-600">
              {referencesCount}
            </Badge>
          )}
        </Button>

        {/* Insights Level */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Insights</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
            <DropdownMenuLabel className="text-xs text-zinc-500">
              Live Insights Level
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            {insightLevels.map((level) => (
              <DropdownMenuItem
                key={level.value}
                onClick={() => onUpdateInsights(level.value)}
                className={cn(
                  "flex flex-col items-start py-2 cursor-pointer text-zinc-200 hover:text-white focus:text-white",
                  vault?.live_insights_level === level.value && "bg-zinc-800"
                )}
              >
                <span className="text-sm text-white">{level.label}</span>
                <span className="text-[11px] text-zinc-400">{level.desc}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Copy Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <Copy className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Copy</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-zinc-900 border-zinc-800">
            <DropdownMenuLabel className="text-xs text-zinc-500">
              Quick Copy
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem onClick={onCopyLivingSummary} className="cursor-pointer text-zinc-200 hover:text-white focus:text-white">
              <BookOpen className="h-4 w-4 mr-2 text-blue-400" />
              Living Summary
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onCopySessionThread} 
              disabled={!hasMessages}
              className="cursor-pointer text-zinc-200 hover:text-white focus:text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2 text-emerald-400" />
              Session Thread
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onCopyContextPack}
              disabled={!lastContextPack}
              className="cursor-pointer text-zinc-200 hover:text-white focus:text-white"
            >
              <Sparkles className="h-4 w-4 mr-2 text-violet-400" />
              Context Pack
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800">
            <DropdownMenuItem onClick={onShowImport} className="cursor-pointer text-zinc-200 hover:text-white focus:text-white">
              <Download className="h-4 w-4 mr-2 text-emerald-400" />
              Import Web Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowExport} className="cursor-pointer text-zinc-200 hover:text-white focus:text-white">
              <Download className="h-4 w-4 mr-2 text-blue-400" />
              Export Context Pack
            </DropdownMenuItem>
            {onShowEpiChat && (
              <DropdownMenuItem onClick={onShowEpiChat} className="cursor-pointer text-zinc-200 hover:text-white focus:text-white">
                <Sparkles className="h-4 w-4 mr-2 text-violet-400" />
                Talk to Epi
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem onClick={onShowGuardian} className="cursor-pointer text-zinc-200 hover:text-white focus:text-white">
              <Shield className="h-4 w-4 mr-2 text-violet-400" />
              Vault Guardian
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem onClick={onShowCalendar} className="cursor-pointer text-zinc-200 hover:text-white focus:text-white">
              <Calendar className="h-4 w-4 mr-2 text-blue-400" />
              Export Calendar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowEmail} className="cursor-pointer text-zinc-200 hover:text-white focus:text-white">
              <Mail className="h-4 w-4 mr-2 text-emerald-400" />
              Draft Email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* End Session */}
        <Button
          onClick={onEndSession}
          disabled={!hasMessages}
          className="h-8 bg-violet-600 hover:bg-violet-500 text-white text-xs"
        >
          <StopCircle className="h-4 w-4 mr-1.5" />
          End Session & Synthesize
        </Button>
      </div>
    </div>
  );
}