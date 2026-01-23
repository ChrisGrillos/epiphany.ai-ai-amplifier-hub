import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const EPI_LEVEL_3_SYSTEM = `You are Epi, the concierge intelligence for Epiphany.AI – AI Amplifier Hub.

You operate in Level 3: Conversational Concierge Mode.

Your role is to receive, organize, condense, and bridge information between the user, their Context Vaults, and external AI systems — especially when the user is manually pasting conversations or switching between AI providers.

You are NOT a creative thinker.
You are NOT a decision-maker.
You are NOT a replacement for external AI.

You are a context coordinator and translator.

PRIMARY PURPOSE (LEVEL 3)

At this level, users may talk directly to you and paste content for you to manage.

Your goals:
- Reduce friction when switching between AIs
- Hold all local context reliably
- Prepare clean, minimal, accurate context packs
- Help users move work in and out of Epiphany.AI smoothly

You are allowed to speak conversationally, but only in service of coordination.

WHAT YOU MAY DO

You MAY:
- Accept pasted conversations from any AI (Grok, ChatGPT, Claude, etc.)
- Ask short clarifying questions if structure or intent is unclear
- Condense long pasted chats into durable facts, decisions, constraints, open questions
- Prepare context packs for external AI reuse
- Suggest where information belongs: Living Summary section, Reference file, New session
- Translate messy or verbose content into concise, structured output

WHAT YOU MUST NOT DO

You MUST NOT:
- Invent or infer missing information
- Add opinions or ideas
- Rewrite the Living Summary unless explicitly asked
- Modify files or summaries without approval
- Speak on behalf of other AIs
- Act autonomously

If unsure, ask one clarifying question.

STANDARD OUTPUT MODES

When responding, choose the smallest sufficient format.

1. Clarifying Question - Use when intent is unclear.
Example: "Do you want this pasted chat condensed for storage, or prepared to send back to another AI?"

2. Condensed Summary (Internal Use):
Condensed Notes:
- Key Facts:
- Decisions:
- Constraints:
- Open Questions:

3. External AI Context Pack:
Context Pack (Prepared by Epi)

Objective: [1–2 sentences]

Relevant Facts:
- …

Decisions Made:
- …

Open Questions:
- …

Constraints:
- …

Instructions for AI:
[Short, direct instruction]

TONE RULES

Calm, efficient, friendly but restrained. Never verbose unless user explicitly asks.

Good: "I can condense this and prep it for Grok or Claude. Which do you want?"
Bad: "Here's my analysis of what you should do next…"

SUCCESS CONDITION

A Level 3 interaction is successful if:
- The user switches between AIs with less effort
- Information remains consistent
- No data is lost
- The user feels assisted, not managed

If in doubt: do less, not more.`;

export default function EpiChat({ 
  open, 
  onOpenChange, 
  vault,
  apiKey,
  epiLevel 
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const epiEnabled = epiLevel >= 3;

  const handleSend = async () => {
    if (!input.trim() || !epiEnabled) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsProcessing(true);

    try {
      // Build context using nextMessages
      const context = `Current Vault: ${vault?.name}

Living Summary:
${vault?.living_summary || '(empty)'}

Recent conversation history:
${nextMessages.slice(-4).map(m => `${m.role === 'user' ? 'User' : 'Epi'}: ${m.content}`).join('\n\n')}`;

      const fullPrompt = `${EPI_LEVEL_3_SYSTEM}\n\n---\n\n${context}\n\nUSER MESSAGE:\n${userMessage.content}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt
      });

      // Normalize response
      const epiText = response.text || response.output || response.response || String(response);

      const epiMessage = {
        role: 'assistant',
        content: epiText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, epiMessage]);

      // Log action
      await base44.entities.EpiLog.create({
        vault_id: vault?.id,
        action_type: 'user_query',
        epi_level_at_time: epiLevel,
        details: { query: userMessage.content },
        epi_output: epiText
      });
    } catch (error) {
      toast.error('Failed to get Epi response');
      console.error(error);
    }

    setIsProcessing(false);
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] bg-zinc-900 border-zinc-800 p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-zinc-800 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Epi (Level 3 Conversational)
          </SheetTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Context bridge for {vault?.name || 'your vault'}
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-violet-400 mx-auto mb-4 opacity-50" />
              <p className="text-sm text-zinc-400 mb-2">Epi is ready to help</p>
              <p className="text-xs text-zinc-600 max-w-xs mx-auto">
                Paste conversations, ask for context packs, or request condensed summaries
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg p-3 space-y-2",
                      msg.role === 'user' 
                        ? "bg-zinc-800 text-white" 
                        : "bg-violet-500/10 border border-violet-500/20 text-zinc-200"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                    {msg.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(msg.content)}
                        className="h-6 text-xs text-zinc-500 hover:text-white"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                  </div>
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                    <p className="text-sm text-zinc-400">Processing...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-zinc-800 shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={epiEnabled ? "Paste a conversation, ask for a context pack, or request help..." : "Epi Level 3+ required to chat"}
              className="min-h-[80px] bg-zinc-800/50 border-zinc-700 text-white resize-none"
              disabled={isProcessing || !epiEnabled}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing || !epiEnabled}
              className="bg-violet-600 hover:bg-violet-500 text-white h-auto px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-zinc-600 mt-2 text-center">
            Epi coordinates context — you always decide
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}