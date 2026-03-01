import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import VaultComments from '@/components/collab/VaultComments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  Target, 
  ListChecks, 
  HelpCircle, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const sectionIcons = {
  'Objective': Target,
  'Key Facts': ListChecks,
  'Decisions': CheckCircle2,
  'Open Questions': HelpCircle,
  'Next Actions': ArrowRight,
};

const sectionColors = {
  'Objective': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Key Facts': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Decisions': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'Open Questions': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Next Actions': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

function parseSummaryToSections(summary) {
  if (!summary) return [];
  
  const sections = [];
  const lines = summary.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent.join('\n').trim()
        });
      }
      currentSection = line.replace('## ', '').trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections.push({
      title: currentSection,
      content: currentContent.join('\n').trim()
    });
  }

  return sections;
}

export default function LiveSummaryView({ 
  open, 
  onOpenChange, 
  summary,
  vaultName,
  vaultId,
  onCheckInsights,
  insightsLoading 
}) {
  const sections = parseSummaryToSections(summary);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] bg-zinc-900 border-zinc-800 p-0">
        <SheetHeader className="p-6 pb-4 border-b border-zinc-800">
          <SheetTitle className="flex items-center gap-2 text-white">
            <BookOpen className="h-5 w-5 text-violet-400" />
            Living Summary
          </SheetTitle>
          <p className="text-xs text-zinc-500 mt-1">{vaultName}</p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-6 space-y-6">
            {sections.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 text-sm">No summary content yet</p>
                <p className="text-zinc-600 text-xs mt-1">
                  Start a session to begin building your Living Summary
                </p>
              </div>
            ) : (
              sections.map((section, idx) => {
                const Icon = sectionIcons[section.title] || BookOpen;
                const colorClass = sectionColors[section.title] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
                
                return (
                  <div key={idx} className="space-y-2">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border",
                      colorClass
                    )}>
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{section.title}</span>
                    </div>
                    <div className="pl-4 border-l-2 border-zinc-800">
                      <div className="prose prose-invert prose-sm max-w-none prose-p:text-zinc-400 prose-li:text-zinc-400 prose-li:marker:text-zinc-600">
                        <ReactMarkdown>
                          {section.content || '*(empty)*'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {vaultId && (
          <div className="p-4 border-t border-zinc-800">
            <VaultComments vaultId={vaultId} targetType="vault" targetId={vaultId} />
          </div>
        )}

        <div className="p-4 border-t border-zinc-800">
          <Button
            variant="outline"
            onClick={onCheckInsights}
            disabled={insightsLoading}
            className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            {insightsLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Check for Live Insights
          </Button>
          <p className="text-[10px] text-zinc-600 text-center mt-2">
            Uses external lookups • Counts toward API usage
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}