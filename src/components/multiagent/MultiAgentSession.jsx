import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Users, Loader2, Send, Zap, AlertTriangle, Plus, X, Copy } from 'lucide-react';
import { PERSONALITY_AGENTS, getAgentById } from './personalityAgents';
import { detectLoop, generateCircuitBreaker } from './loopDetector';
import { publish, subscribe, MSG_TYPES } from './agentBus';

export default function MultiAgentSession({ open, onOpenChange, vault }) {
  const [activeAgents, setActiveAgents] = useState(['researcher', 'devils_advocate']);
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loopWarning, setLoopWarning] = useState(null);
  const [rounds, setRounds] = useState(2);
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to loop detected events
  useEffect(() => {
    const unsub = subscribe(MSG_TYPES.LOOP_DETECTED, (msg) => {
      setLoopWarning(msg.reason);
    });
    return unsub;
  }, []);

  const toggleAgent = (agentId) => {
    setActiveAgents(prev =>
      prev.includes(agentId)
        ? prev.length > 1 ? prev.filter(id => id !== agentId) : prev
        : [...prev, agentId]
    );
  };

  const addAgentMessage = (agentId, content, isBreaker = false) => {
    const agent = getAgentById(agentId);
    const msg = {
      id: `${agentId}_${Date.now()}`,
      agentId,
      agentName: agent?.name || agentId,
      agentIcon: agent?.icon || '🤖',
      color: agent?.color || 'text-zinc-400',
      bgColor: agent?.bgColor || 'bg-zinc-800',
      borderColor: agent?.borderColor || 'border-zinc-700',
      content,
      timestamp: new Date().toISOString(),
      isBreaker,
    };
    setMessages(prev => [...prev, msg]);
    publish({ type: MSG_TYPES.AGENT_REPLY, from: agentId, content });
    return msg;
  };

  const runSession = async () => {
    if (!topic.trim()) { toast.error('Enter a topic or question first'); return; }
    if (activeAgents.length < 2) { toast.error('Select at least 2 agents'); return; }

    setIsRunning(true);
    setMessages([]);
    setLoopWarning(null);

    const vaultContext = vault?.living_summary
      ? `\n\nVault Context (Living Summary):\n${vault.living_summary.slice(0, 1500)}`
      : '';

    let conversationHistory = `Topic: ${topic}${vaultContext}`;

    for (let round = 0; round < rounds; round++) {
      for (const agentId of activeAgents) {
        const agent = getAgentById(agentId);
        if (!agent) continue;

        const prompt = `${agent.systemPrompt}

${conversationHistory}

Your turn as ${agent.name}. Respond directly and stay in your role. Be specific and add new value — do not repeat what has already been said.`;

        let response;
        try {
          response = await base44.integrations.Core.InvokeLLM({ prompt });
          response = response.text || response.output || response.response || String(response);
        } catch {
          response = `(${agent.name} failed to respond)`;
        }

        addAgentMessage(agentId, response);
        conversationHistory += `\n\n[${agent.name}]: ${response}`;

        // Check for loop after each message
        const allMessages = [...messages, { content: response }];
        if (allMessages.length >= 6) {
          const loop = detectLoop(allMessages);
          if (loop.detected) {
            publish({ type: MSG_TYPES.LOOP_DETECTED, reason: loop.reason, severity: loop.severity });
            const breakerPrompt = generateCircuitBreaker(loop.reason, vault?.living_summary || '');
            const breakerResponse = await base44.integrations.Core.InvokeLLM({ prompt: breakerPrompt })
              .then(r => r.text || r.output || String(r))
              .catch(() => 'Circuit breaker: step back and try a fresh angle.');
            addAgentMessage('epi_breaker', `**⚡ Loop Detected — Circuit Breaker Injected**\n\n${breakerResponse}`, true);
            conversationHistory += `\n\n[Circuit Breaker]: ${breakerResponse}`;
            setLoopWarning(null);
          }
        }
      }
    }

    // Final synthesis pass
    const synthAgent = getAgentById('synthesizer');
    if (synthAgent && !activeAgents.includes('synthesizer')) {
      const synthPrompt = `${synthAgent.systemPrompt}

${conversationHistory}

Produce a final synthesis of this multi-agent discussion. Highlight the most important convergent insights and any unresolved tensions.`;
      try {
        const synthResponse = await base44.integrations.Core.InvokeLLM({ prompt: synthPrompt });
        const synthText = synthResponse.text || synthResponse.output || String(synthResponse);
        addAgentMessage('synthesizer', `**Final Synthesis**\n\n${synthText}`);
      } catch {
        // skip
      }
    }

    setIsRunning(false);
    toast.success('Multi-agent session complete');
  };

  const copySession = () => {
    const text = messages.map(m => `[${m.agentName}]:\n${m.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Session copied');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[680px] sm:max-w-[680px] bg-zinc-900 border-zinc-800 p-0 flex flex-col">
        <SheetHeader className="p-4 pb-3 border-b border-zinc-800 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Users className="h-4 w-4 text-violet-400" />
            Multi-Agent Session
          </SheetTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Assign personality agents to a topic. They'll debate, challenge, and synthesize — with loop detection.
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Topic Input */}
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Topic or Question</label>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. What's the best go-to-market strategy for a B2B SaaS product?"
                className="bg-zinc-800 border-zinc-700 text-white text-sm resize-none min-h-[70px]"
                disabled={isRunning}
              />
            </div>

            {/* Agent Selector */}
            <div>
              <label className="text-xs text-zinc-400 mb-2 block font-medium">Active Agents</label>
              <div className="grid grid-cols-2 gap-2">
                {PERSONALITY_AGENTS.map(agent => {
                  const isActive = activeAgents.includes(agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      disabled={isRunning}
                      className={cn(
                        'flex items-start gap-2 p-3 rounded-xl border text-left transition-all',
                        isActive
                          ? cn(agent.bgColor, agent.borderColor, 'ring-1 ring-violet-500/30')
                          : 'bg-zinc-800/40 border-zinc-700 opacity-50 hover:opacity-80'
                      )}
                    >
                      <span className="text-xl mt-0.5">{agent.icon}</span>
                      <div>
                        <p className={cn('text-xs font-semibold', isActive ? agent.color : 'text-zinc-400')}>
                          {agent.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{agent.description}</p>
                      </div>
                      {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-violet-400 mt-1 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rounds */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-zinc-400 font-medium">Discussion rounds:</label>
              {[1, 2, 3].map(r => (
                <button
                  key={r}
                  onClick={() => setRounds(r)}
                  disabled={isRunning}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                    rounds === r ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Loop Warning Banner */}
            {loopWarning && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-300">Loop Detected</p>
                  <p className="text-[11px] text-amber-400/80 mt-0.5">{loopWarning}</p>
                </div>
              </div>
            )}

            {/* Run Button */}
            <Button
              onClick={runSession}
              disabled={isRunning || !topic.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 h-11 text-white"
            >
              {isRunning ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running session…</>
              ) : (
                <><Zap className="h-4 w-4 mr-2" /> Run Multi-Agent Session</>
              )}
            </Button>

            {/* Messages */}
            {messages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-300">Session Output</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copySession}
                    className="h-7 px-2 text-zinc-500 hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy All
                  </Button>
                </div>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'rounded-xl border p-3',
                      msg.isBreaker
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : msg.agentId === 'synthesizer'
                        ? 'bg-violet-500/10 border-violet-500/30'
                        : cn(msg.bgColor, msg.borderColor)
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-sm">{msg.agentIcon}</span>
                      <span className={cn('text-xs font-semibold', msg.isBreaker ? 'text-amber-300' : msg.color)}>
                        {msg.agentName}
                      </span>
                      <span className="text-[10px] text-zinc-600 ml-auto">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <ReactMarkdown
                      className="prose prose-invert prose-sm max-w-none text-zinc-300 [&>*:first-child]:mt-0"
                      components={{
                        p: ({ children }) => <p className="my-1 text-xs leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                        li: ({ children }) => <li className="text-xs text-zinc-400">{children}</li>,
                        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                        h2: ({ children }) => <h2 className="text-sm font-semibold text-white my-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-semibold text-zinc-200 my-1">{children}</h3>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ))}
                <div ref={messagesEnd} />
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}