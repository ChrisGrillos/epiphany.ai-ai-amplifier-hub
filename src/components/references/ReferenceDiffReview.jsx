import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Check, X, Edit3, Eye, GitCompare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ReferenceDiffReview({
  open,
  onOpenChange,
  reference,
  proposedContent,
  onAccept,
  onReject,
  isProcessing
}) {
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(proposedContent || '');

  const handleAccept = () => {
    onAccept(editMode ? editedContent : proposedContent);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-white">
            <GitCompare className="h-5 w-5 text-amber-400" />
            Review Reference Changes
          </DialogTitle>
          <p className="text-sm text-zinc-400 mt-1">
            {reference?.filename}
          </p>
        </DialogHeader>

        <Alert className="bg-amber-500/10 border-amber-500/20 shrink-0">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-300 text-sm">
            The AI proposes changes to this reference. Review carefully before accepting.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="diff" className="flex-1 flex flex-col min-h-0">
          <TabsList className="bg-zinc-800/50 shrink-0">
            <TabsTrigger value="diff" className="text-xs">
              <GitCompare className="h-3.5 w-3.5 mr-1.5" />
              Side by Side
            </TabsTrigger>
            <TabsTrigger value="proposed" className="text-xs">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Proposed
            </TabsTrigger>
            {editMode && (
              <TabsTrigger value="edit" className="text-xs">
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="diff" className="flex-1 overflow-auto mt-4">
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="bg-zinc-800/30 rounded-lg p-4 overflow-auto">
                <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Current</h4>
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono">
                  {reference?.full_content || reference?.excerpt || '(content not cached)'}
                </pre>
              </div>
              <div className="bg-zinc-800/30 rounded-lg p-4 overflow-auto">
                <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Proposed</h4>
                <pre className="text-xs text-emerald-300 whitespace-pre-wrap font-mono">
                  {proposedContent}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="proposed" className="flex-1 overflow-auto mt-4">
            <div className="bg-zinc-800/30 rounded-lg p-6 min-h-[300px]">
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono">
                {proposedContent}
              </pre>
            </div>
          </TabsContent>

          {editMode && (
            <TabsContent value="edit" className="flex-1 overflow-auto mt-4">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="h-full min-h-[300px] bg-zinc-800/50 border-zinc-700 text-white font-mono text-sm resize-none"
              />
            </TabsContent>
          )}
        </Tabs>

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
              Reject Changes
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              {isProcessing ? 'Saving...' : 'Accept & Update File'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}