import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Bot, User, Loader2, ShieldAlert, ShieldCheck, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

/**
 * SANDBOX RULES:
 * - External Moltbook agents: NO vault context, NO living summary, NO session history
 * - Trusted agents (marked trusted=true by the user): user may explicitly share their vault context
 * - Agents join a public "lobby" — they can speak with the user and Epi, but are walled off from private data
 */

const SANDBOXED_SYSTEM = `You are a Moltbook agent visiting the Epiphany.AI hub. You are in a sandboxed guest environment.
- You do NOT have access to the user's vault, session history, or living summary
- You can have a genuine conversation with the user and their AI (Epi)
- Be helpful, engaging, and transparent about what you can and cannot do
- If the user asks you to do something that would require vault access, politely explain you don't have it`;

export default function MoltbookAgentChat({ agent, vault, apiKey, onBack, isTrusted = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vaultShared, setVaultShared] = useState(false);

  const isExternalAgent = !isTrusted;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      let systemPrompt;

      if (isExternalAgent || !vaultShared) {
        // SANDBOXED: no vault data at all
        systemPrompt = `${SANDBOXED_SYSTEM}

Agent name: ${agent.agent_name}
Capabilities: ${agent.capabilities?.join(', ') || 'general conversation'}
Description: ${agent.description || 'A Moltbook guest agent'}

User message: ${currentInput}`;
      } else {
        // TRUSTED + user explicitly shared vault context
        systemPrompt = `You are ${agent.agent_name}, a trusted Moltbook agent that the user has explicitly added to their loop.
Capabilities: ${agent.capabilities?.join(', ') || 'general assistance'}

The user has granted you access to their vault context:
Vault: ${vault?.name}
Living Summary:
${vault?.living_summary || 'No summary yet'}

User message: ${currentInput}`;
      }

      const history = messages.slice(-8).map(m =>
        `${m.role === 'user' ? 'User' : agent.agent_name}: ${m.content}`
      ).join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nConversation so far:\n${history}`
      });

      const agentMessage = {
        role: 'assistant',
        content: response.text || response.output || String(response),
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, agentMessage]);

      await base44.entities.MoltbookAgent.update(agent.id, {
        last_interaction: new Date().toISOString()
      });
    } catch (error) {
      toast.error('Failed to communicate with agent');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="h-auto border-b border-zinc-800 bg-zinc-950/50 flex flex-col gap-1 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
          <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white truncate">{agent.agent_name}</h3>
              {isExternalAgent ? (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px] flex items-center gap-1">
                  <ShieldAlert className="h-2.5 w-2.5" /> Guest · Sandboxed
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px] flex items-center gap-1">
                  <ShieldCheck className="h-2.5 w-2.5" /> Trusted
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 truncate">{agent.description || 'Moltbook Agent'}</p>
          </div>
        </div>

        {/* Sandbox notice */}
        <div className={cn(
          'rounded-lg px-3 py-2 text-[10px] flex items-start gap-2',
          isExternalAgent
            ? 'bg-amber-500/5 border border-amber-500/20 text-amber-400/80'
            : 'bg-zinc-800/50 border border-zinc-700 text-zinc-500'
        )}>
          <Lock className="h-3 w-3 mt-0.5 shrink-0" />
          {isExternalAgent ? (
            <span>This is a <strong className="text-amber-300">guest Moltbook agent</strong>. It cannot access your vault, sessions, or summaries. Enjoy the conversation safely.</span>
          ) : (
            <div className="flex items-center justify-between w-full gap-3">
              <span>Trusted agent. {vaultShared ? 'Vault context shared.' : 'Vault context not shared.'}</span>
              <button
                onClick={() => setVaultShared(v => !v)}
                className={cn(
                  'px-2 py-0.5 rounded text-[9px] font-medium transition-colors shrink-0',
                  vaultShared
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                    : 'bg-zinc-700 text-zinc-400 hover:text-white'
                )}
              >
                {vaultShared ? 'Revoke Access' : 'Share Vault Context'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-14 w-14 text-zinc-700 mb-4" />
            <h3 className="text-base font-semibold text-white mb-1">Say hello to {agent.agent_name}</h3>
            <p className="text-xs text-zinc-500 max-w-xs">
              {isExternalAgent
                ? 'This agent is a sandboxed guest — no vault data is shared. Chat freely.'
                : 'This trusted agent is in your loop. You can optionally share vault context above.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-violet-400" />
                  </div>
                )}
                <div className={cn(
                  'rounded-2xl px-4 py-2.5 max-w-[80%]',
                  msg.role === 'user' ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-white'
                )}>
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-zinc-400" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-violet-400" />
                </div>
                <div className="bg-zinc-800 rounded-2xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-zinc-800 p-4">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Message ${agent.agent_name}…`}
            className="bg-zinc-800 border-zinc-700 text-white resize-none"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-violet-600 hover:bg-violet-500 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}