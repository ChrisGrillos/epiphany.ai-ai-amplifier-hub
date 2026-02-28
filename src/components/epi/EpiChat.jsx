import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Copy, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import EpiRoleSelector from './EpiRoleSelector';
import { EPI_ROLES, ROLE_COLORS, buildRoleSystemPrompt } from './epiRoles';

export default function EpiChat({ open, onOpenChange, vault, apiKey, epiLevel }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeRole, setActiveRole] = useState('research');
  const [showRoles, setShowRoles] = useState(false);
  const bottomRef = useRef(null);

  const epiEnabled = epiLevel >= 3;
  const role = EPI_ROLES[activeRole];
  const colors = ROLE_COLORS[role.color];

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', vault?.id],
    queryFn: () => vault ? base44.entities.Session.filter({ vault_id: vault.id }, '-created_date', 5) : [],
    enabled: !!vault && open,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleRoleSelect = (roleId) => {
    setActiveRole(roleId);
    setShowRoles(false);
    if (messages.length > 0) {
      toast.info(`Switched to ${EPI_ROLES[roleId].label} — conversation reset`);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !epiEnabled) return;

    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsProcessing(true);

    try {
      const systemPrompt = buildRoleSystemPrompt(activeRole, vault, sessions);
      const historyText = nextMessages.slice(-6)
        .map(m => `${m.role === 'user' ? 'User' : 'Epi'}: ${m.content}`)
        .join('\n\n');

      const fullPrompt = `${systemPrompt}\n\n━━━ CONVERSATION ━━━\n${historyText}`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt: fullPrompt });
      const epiText = response.text || response.output || response.response || String(response);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: epiText,
        timestamp: new Date().toISOString(),
        roleId: activeRole,
      }]);

      await base44.entities.EpiLog.create({
        vault_id: vault?.id,
        action_type: 'user_query',
        epi_level_at_time: epiLevel,
        details: { query: userMessage.content, role: activeRole },
        epi_output: epiText,
      });
    } catch (error) {
      toast.error('Failed to get Epi response');
    }

    setIsProcessing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px] bg-zinc-900 border-zinc-800 p-0 flex flex-col">

        {/* Header */}
        <SheetHeader className="p-4 pb-0 border-b border-zinc-800 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-4 w-4 text-violet-400" />
            Epi
            <span className={cn('text-xs px-2 py-0.5 rounded-full border', colors.badge)}>
              {role.icon} {role.label}
            </span>
          </SheetTitle>

          <button
            onClick={() => setShowRoles(v => !v)}
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors pb-3 pt-1"
          >
            {showRoles ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showRoles ? 'Hide roles' : 'Switch role'}
            <span className="text-zinc-600 ml-1">· {role.tagline}</span>
          </button>

          {showRoles && (
            <div className="border-t border-zinc-800">
              <EpiRoleSelector activeRole={activeRole} onSelect={handleRoleSelect} />
              <div className={cn('mx-4 mb-3 p-3 rounded-lg text-[11px] leading-relaxed border', colors.bg, colors.border)}>
                <span className={cn(colors.text, 'font-semibold')}>Condensation focus: </span>
                <span className="text-zinc-400">{EPI_ROLES[activeRole].condensationFocus}</span>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 px-4">
              <span className="text-4xl block mb-3">{role.icon}</span>
              <p className="text-sm font-medium text-white mb-1">{role.label}</p>
              <p className="text-xs text-zinc-500 mb-4">{role.description}</p>
              <div className={cn('p-3 rounded-lg border text-left text-[11px]', colors.bg, colors.border)}>
                <p className={cn('font-semibold mb-1', colors.text)}>💡 Condensation focus</p>
                <p className="text-zinc-400">{role.condensationFocus}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {messages.map((msg, idx) => {
                const msgRole = msg.roleId ? EPI_ROLES[msg.roleId] : role;
                const msgColors = msgRole ? ROLE_COLORS[msgRole.color] : colors;
                return (
                  <div key={idx} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-sm', msgColors.bg)}>
                        {msgRole?.icon || '✨'}
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[88%] rounded-xl px-3 py-2.5 text-sm',
                      msg.role === 'user'
                        ? 'bg-zinc-800 text-white'
                        : cn('border', msgColors.bg, msgColors.border, 'text-zinc-200')
                    )}>
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown
                          className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                          components={{
                            hr: () => <hr className="border-zinc-700 my-3" />,
                            p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="my-1 ml-4 list-disc space-y-0.5">{children}</ul>,
                            li: ({ children }) => <li className="text-zinc-300">{children}</li>,
                            strong: ({ children }) => <strong className={cn('font-semibold', msgColors.text)}>{children}</strong>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(msg.content); toast.success('Copied'); }}
                          className="mt-2 flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {isProcessing && (
                <div className="flex gap-2">
                  <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', colors.bg)}>
                    <Loader2 className={cn('h-3.5 w-3.5 animate-spin', colors.text)} />
                  </div>
                  <div className={cn('rounded-xl px-3 py-2 border text-xs text-zinc-400', colors.bg, colors.border)}>
                    {role.label} is thinking…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Quick actions */}
        {messages.length === 0 && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap shrink-0">
            {getQuickActions(activeRole).map(action => (
              <button
                key={action}
                onClick={() => setInput(action)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-zinc-800 shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={epiEnabled ? `Ask ${role.label}… or paste a conversation to condense` : 'Epi Level 3+ required'}
              className="min-h-[72px] bg-zinc-800/50 border-zinc-700 text-white resize-none text-sm"
              disabled={isProcessing || !epiEnabled}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing || !epiEnabled}
              className={cn('h-auto px-3 text-white', colors.active)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className={cn('text-[10px]', colors.text)}>{role.icon} {role.label}</span>
            <span className="text-[10px] text-zinc-600">Handoff block auto-generated on condensation</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getQuickActions(roleId) {
  const actions = {
    research: ['Condense last session', 'What do we know for sure?', 'Prep context pack for Grok'],
    decision: ['Summarize the decision so far', 'What are the trade-offs?', 'What is still unresolved?'],
    creative: ['Capture the current direction', 'What have we tried and rejected?', 'Prep brief for another AI'],
    taskmanager: ['Extract all tasks from session', 'What is blocked?', 'Compress task list for handoff'],
  };
  return actions[roleId] || actions.research;
}