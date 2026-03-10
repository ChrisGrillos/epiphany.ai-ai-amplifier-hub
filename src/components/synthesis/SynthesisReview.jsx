import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, 
  X, 
  Edit3, 
  Plus, 
  Minus, 
  RefreshCw,
  Sparkles,
  AlertCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

function similarityRatio(a, b) {
  const left = (a || '').trim();
  const right = (b || '').trim();
  const maxLen = Math.max(left.length, right.length);
  if (maxLen === 0) return 0;
  return levenshteinDistance(left.toLowerCase(), right.toLowerCase()) / maxLen;
}

function splitBySection(summary) {
  const lines = (summary || '').split('\n').filter((l) => l.trim());
  const entries = [];
  let section = 'root';

  for (const line of lines) {
    if (line.startsWith('##')) {
      section = line.replace(/^##\s*/, '').trim() || 'root';
      continue;
    }
    entries.push({ section, text: line });
  }

  return entries;
}

function diffSummaries(oldSummary, newSummary) {
  const oldEntries = splitBySection(oldSummary);
  const newEntries = splitBySection(newSummary);

  const oldBySection = oldEntries.reduce((acc, entry) => {
    acc[entry.section] = acc[entry.section] || [];
    acc[entry.section].push(entry.text);
    return acc;
  }, {});

  const newBySection = newEntries.reduce((acc, entry) => {
    acc[entry.section] = acc[entry.section] || [];
    acc[entry.section].push(entry.text);
    return acc;
  }, {});

  const oldSet = new Set(oldEntries.map((e) => `${e.section}::${e.text}`));
  const newSet = new Set(newEntries.map((e) => `${e.section}::${e.text}`));

  const removedPool = oldEntries.filter((e) => !newSet.has(`${e.section}::${e.text}`));
  const addedPool = newEntries.filter((e) => !oldSet.has(`${e.section}::${e.text}`));

  const modified = [];

  const consumedAdded = new Set();
  const consumedRemoved = new Set();

  Object.keys({ ...oldBySection, ...newBySection }).forEach((section) => {
    const sectionRemoved = removedPool
      .map((entry, idx) => ({ ...entry, idx }))
      .filter((entry) => entry.section === section);
    const sectionAdded = addedPool
      .map((entry, idx) => ({ ...entry, idx }))
      .filter((entry) => entry.section === section);

    for (const removedEntry of sectionRemoved) {
      if (consumedRemoved.has(removedEntry.idx)) continue;

      let best = null;
      for (const addedEntry of sectionAdded) {
        if (consumedAdded.has(addedEntry.idx)) continue;
        const ratio = similarityRatio(removedEntry.text, addedEntry.text);
        if (ratio <= 0.3 && (!best || ratio < best.ratio)) {
          best = { idx: addedEntry.idx, ratio, text: addedEntry.text };
        }
      }

      if (best) {
        consumedRemoved.add(removedEntry.idx);
        consumedAdded.add(best.idx);
        modified.push({
          section,
          from: removedEntry.text,
          to: best.text,
        });
      }
    }
  });

  const added = addedPool
    .filter((entry, idx) => !consumedAdded.has(idx))
    .map((entry) => entry.text);
  const removed = removedPool
    .filter((entry, idx) => !consumedRemoved.has(idx))
    .map((entry) => entry.text);

  return { added, removed, modified };
}

export default function SynthesisReview({
  open,
  onOpenChange,
  currentSummary,
  proposedSummary,
  onAccept,
  onReject,
  isProcessing
}) {
  const [editMode, setEditMode] = useState(false);
  const [editedSummary, setEditedSummary] = useState(proposedSummary || '');
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    setEditedSummary(proposedSummary || '');
  }, [proposedSummary]);

  const changes = diffSummaries(currentSummary, proposedSummary);

  const handleAccept = () => {
    onAccept(editMode ? editedSummary : proposedSummary);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Review Synthesis
          </DialogTitle>
        </DialogHeader>

        {/* Change Summary Bar */}
        <div className="flex items-center gap-3 py-3 px-4 bg-zinc-800/30 rounded-lg shrink-0">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Changes:</span>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
            <Plus className="h-3 w-3 mr-1" />
            {changes.added.length} added
          </Badge>
          <Badge variant="outline" className="border-red-500/30 text-red-400">
            <Minus className="h-3 w-3 mr-1" />
            {changes.removed.length} removed
          </Badge>
          <Badge variant="outline" className="border-amber-500/30 text-amber-400">
            <RefreshCw className="h-3 w-3 mr-1" />
            {changes.modified.length} modified
          </Badge>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="bg-zinc-800/50 shrink-0">
            <TabsTrigger value="preview" className="text-xs">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="diff" className="text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Side by Side
            </TabsTrigger>
            {editMode && (
              <TabsTrigger value="edit" className="text-xs">
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            <div className="bg-zinc-800/30 rounded-lg p-6 min-h-[300px]">
              <div className="prose prose-invert prose-sm max-w-none">
                {(editMode ? editedSummary : proposedSummary)?.split('\n').map((line, idx) => {
                  const isAdded = changes.added.includes(line);
                  const isRemoved = changes.removed.includes(line);
                  const isHeading = line.startsWith('##');
                  
                  return (
                    <p 
                      key={idx}
                      className={cn(
                        "my-1",
                        isHeading && "text-white font-semibold text-base mt-4 first:mt-0",
                        isAdded && "bg-emerald-500/10 border-l-2 border-emerald-500 pl-2 text-emerald-300",
                        isRemoved && "bg-red-500/10 border-l-2 border-red-500 pl-2 text-red-300 line-through opacity-50",
                        !isHeading && !isAdded && !isRemoved && "text-zinc-300"
                      )}
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="diff" className="flex-1 overflow-auto mt-4">
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="bg-zinc-800/30 rounded-lg p-4 overflow-auto">
                <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Current</h4>
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono">
                  {currentSummary}
                </pre>
              </div>
              <div className="bg-zinc-800/30 rounded-lg p-4 overflow-auto">
                <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Proposed</h4>
                <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
                  {proposedSummary}
                </pre>
              </div>
            </div>
          </TabsContent>

          {editMode && (
            <TabsContent value="edit" className="flex-1 overflow-auto mt-4">
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="h-full min-h-[300px] bg-zinc-800/50 border-zinc-700 text-white font-mono text-sm resize-none"
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800 shrink-0">
          <Button
            variant="ghost"
            onClick={() => setEditMode(!editMode)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {editMode ? 'Exit Edit Mode' : 'Edit Before Saving'}
          </Button>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onReject}
              disabled={isProcessing}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              {isProcessing ? 'Saving...' : 'Accept & Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
