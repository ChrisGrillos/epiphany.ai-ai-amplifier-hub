import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SOURCES = [
  { value: 'grok_web', label: 'Grok Web' },
  { value: 'chatgpt_web', label: 'ChatGPT Web' },
  { value: 'claude_web', label: 'Claude Web' },
  { value: 'other', label: 'Other' },
];

export default function ImportWebChatModal({ 
  open, 
  onOpenChange, 
  onImport,
  hasActiveSession 
}) {
  const [source, setSource] = useState('grok_web');
  const [conversationText, setConversationText] = useState('');
  const [appendToCurrent, setAppendToCurrent] = useState(false);
  const [runSynthesis, setRunSynthesis] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const parseConversation = (text) => {
    // Best-effort parsing - preserve raw text if roles can't be inferred
    const messages = [];
    const lines = text.split('\n');
    let currentRole = null;
    let currentContent = [];

    const rolePatterns = {
      user: /^(you|user|human|me):/i,
      assistant: /^(assistant|ai|grok|chatgpt|claude|bot):/i,
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let matchedRole = null;
      for (const [role, pattern] of Object.entries(rolePatterns)) {
        if (pattern.test(trimmed)) {
          matchedRole = role;
          break;
        }
      }

      if (matchedRole) {
        // Save previous message
        if (currentRole && currentContent.length > 0) {
          messages.push({
            role: currentRole,
            content: currentContent.join('\n').trim(),
            timestamp: new Date().toISOString()
          });
        }
        // Start new message
        currentRole = matchedRole;
        currentContent = [trimmed.replace(rolePatterns[matchedRole], '').trim()];
      } else if (currentRole) {
        currentContent.push(trimmed);
      }
    }

    // Save last message
    if (currentRole && currentContent.length > 0) {
      messages.push({
        role: currentRole,
        content: currentContent.join('\n').trim(),
        timestamp: new Date().toISOString()
      });
    }

    // If no roles detected, treat entire text as user message
    if (messages.length === 0 && text.trim()) {
      messages.push({
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString()
      });
    }

    return messages;
  };

  const handleImport = async () => {
    if (!conversationText.trim()) return;

    setIsImporting(true);

    try {
      const messages = parseConversation(conversationText);
      const sourceName = SOURCES.find(s => s.value === source)?.label || 'Unknown';

      await onImport({
        messages,
        source: 'external_web_chat',
        import_source_name: sourceName,
        appendToCurrent,
        runSynthesis
      });

      setConversationText('');
      onOpenChange(false);
    } catch (error) {
      console.error('Import failed:', error);
    }

    setIsImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Download className="h-5 w-5 text-emerald-400" />
            Import Web Chat
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Import conversations from other AI platforms to maintain memory continuity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2 flex-1 overflow-auto">
          {/* Source Selection */}
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conversation Text */}
          <div className="space-y-2 flex-1 flex flex-col">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">
              Paste Conversation
            </Label>
            <Textarea
              value={conversationText}
              onChange={(e) => setConversationText(e.target.value)}
              placeholder="User: Hello, can you help me with...
Assistant: Of course! I'd be happy to help...

(Tip: Use 'User:' and 'Assistant:' prefixes for best parsing)"
              className="flex-1 min-h-[200px] bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 font-mono text-sm resize-none"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            {hasActiveSession && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="append"
                  checked={appendToCurrent}
                  onCheckedChange={setAppendToCurrent}
                />
                <label
                  htmlFor="append"
                  className="text-sm text-zinc-300 cursor-pointer"
                >
                  Append to current session (instead of creating new)
                </label>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="synthesize"
                checked={runSynthesis}
                onCheckedChange={setRunSynthesis}
              />
              <label
                htmlFor="synthesize"
                className="text-sm text-zinc-300 cursor-pointer"
              >
                Run synthesis after import
              </label>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="bg-emerald-500/10 border-emerald-500/20">
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-300 text-xs">
              Imported sessions are marked as read-only and can be synthesized normally 
              to update your Living Summary.
            </AlertDescription>
          </Alert>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-zinc-800 shrink-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
            className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!conversationText.trim() || isImporting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Import Chat
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}