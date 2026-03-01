import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Users, Loader2, Zap, AlertTriangle, Copy } from 'lucide-react';
import { PERSONALITY_AGENTS, getAgentById } from './personalityAgents';
import { detectLoop, generateCircuitBreaker } from './loopDetector';
import { publish, subscribe, MSG_TYPES } from './agentBus';
import AgentConfigPresets from './AgentConfigPresets';
import AgentGraph from './AgentGraph';
import CircuitBreakerInput from './CircuitBreakerInput';

export default function MultiAgentSession({ open, onOpenChange, vault }) {
  const [activeAgents, setActiveAgents] = useState(['researcher', 'devils_advocate']);
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loopWarning, setLoopWarning] = useState(null);
  const [rounds, setRounds] = useState(2);
  const [currentAgentId, setCurrentAgentId] = useState(null);
  const messagesEnd = useRef(null);
  // Ref to let manual circuit breaker communicate into the running loop
  const breakerQueue = useRef([]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      agentName: agent?.name || (isBreaker ? '⚡ Circuit Breaker' : agentId),
      agentIcon: agent?.icon || (isBreaker ? '⚡' : '🤖'),
      color: agent?.color || (isBreaker ? 'text-amber-300' : 'text-zinc-400'),
      bgColor: agent?.bgColor || (isBreaker ? 'bg-amber-500/10' : 'bg-zinc-800'),
      borderColor: agent?.borderColor || (isBreaker ? 'border-amber-500/30' : 'border-zinc-700'),
      content,
      timestamp: new Date().toISOString(),
      isBreaker,
    };
    setMessages(prev => [...prev, msg]);
    publish({ type: MSG_TYPES.AGENT_REPLY, from: agentId, content });
    return msg;
  };

  const injectManualBreaker = (msg) => {
    breakerQueue.current.push(msg);
    if (!isRunning) {
      // If not running, just show it immediately
      addAgentMessage('epi_breaker', `**⚡ Manual Circuit Breaker**\n\n${msg}`, true);
    } else {
      toast.success('Circuit breaker queued — will inject between agent turns');
    }
  };

  const runSession = async () => {
    if (!topic.trim()) { toast.error('Enter a topic or question first'); return; }
    if (activeAgents.length < 2) { toast.error('Select at least 2 agents'); return; }

    setIsRunning(true);
    setMessages([]);
    setLoopWarning(null);
    breakerQueue.current = [];

    const vaultContext = vault?.living_summary
      ? `\n\nVault Context (Living Summary):\n${vault.living_summary.slice(0, 1500)}`
      : '';

    let conversationHistory = `Topic: ${topic}${vaultContext}`;
    const liveMessages = [];

    const addMsg = (agentId, content, isBreaker = false) => {
      const msg = addAgentMessage(agentId, content, isBreaker);
      liveMessages.push({ agentId, content });
      return msg;
    };

    for (let round = 0; round < rounds; round++) {
      for (const agentId of activeAgents) {
        // Check for queued manual breakers before each agent turn
        while (breakerQueue.current.length > 0) {
          const breakerMsg = breakerQueue.current.shift();
          addMsg('epi_breaker', `**⚡ Manual Circuit Breaker Injected**\n\n${breakerMsg}`, true);
          conversationHistory += `\n\n[Circuit Breaker - User Injected]: ${breakerMsg}`;
        }

        const agent = getAgentById(agentId);
        if (!agent) continue;

        setCurrentAgentId(agentId);

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

        addMsg(agentId, response);
        conversationHistory += `\n\n[${agent.name}]: ${response}`;

        // Auto loop detection
        if (liveMessages.length >= 6) {
          const loop = detectLoop(liveMessages);
          if (loop.detected) {
            publish({ type: MSG_TYPES.LOOP_DETECTED, reason: loop.reason, severity: loop.severity });
            const breakerPrompt = generateCircuitBreaker(loop.reason, vault?.living_summary || '');
            const breakerResponse = await base44.integrations.Core.InvokeLLM({ prompt: breakerPrompt })
              .then(r => r.text || r.output || String(r))
              .catch(() => 'Circuit breaker: step back and try a fresh angle.');
            addMsg('epi_breaker', `**⚡ Auto Loop Detected — Circuit Breaker**\n\n${breakerResponse}`, true);
            conversationHistory += `\n\n[Auto Circuit Breaker]: ${breakerResponse}`;
            setLoopWarning(null);
          }
        }
      }
    }

    // Final synthesis pass (always, if synthesizer not already active)
    const synthAgent = getAgentById('synthesizer');
    if (synthAgent && !activeAgents.includes('synthesizer')) {
      setCurrentAgentId('synthesizer');
      const synthPrompt = `${synthAgent.systemPrompt}

${conversationHistory}

Produce a final synthesis of this multi-agent discussion. Highlight the most important convergent insights and any unresolved tensions.`;
      try {
        const synthResponse = await base44.integrations.Core.InvokeLLM({ prompt: synthPrompt });
        const synthText = synthResponse.text || synthResponse.output || String(synthResponse);
        addMsg('synthesizer', `**Final Synthesis**\n\n${synthText}`);
      } catch { /* skip */ }
    }

    setCurrentAgentId(null);
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
      <SheetContent className="w-[720px] sm:max-w-[720px] bg-zinc-900 border-zinc-800 p-0 flex flex-col">
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

            {/* Presets */}
            <AgentConfigPresets
              activeAgents={activeAgents}
              rounds={rounds}
              onLoad={(agents, r) => { setActiveAgents(agents); setRounds(r); }}
            />

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

            {/* Two-column: agent selector + graph */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 mb-2 block font-medium">Active Agents</label>
                <div className="space-y-1.5">
                  {PERSONALITY_AGENTS.map(agent => {
                    const isActive = activeAgents.includes(agent.id);
                    const isCurrent = agent.id === currentAgentId;
                    return (
                      <button
                        key={agent.id}
                        onClick={() => toggleAgent(agent.id)}
                        disabled={isRunning}
                        className={cn(
                          'w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all',
                          isActive
                            ? cn(agent.bgColor, agent.borderColor, isCurrent && 'ring-1 ring-violet-400 ring-offset-1 ring-offset-zinc-900')
                            : 'bg-zinc-800/40 border-zinc-700 opacity-40 hover:opacity-70'
                        )}
                      >
                        <span className="text-base">{agent.icon}</span>
                        <div className="min-w-0">
                          <p className={cn('text-xs font-semibold truncate', isActive ? agent.color : 'text-zinc-500')}>
                            {agent.name}
                          </p>
                          <p className="text-[9px] text-zinc-600 truncate">{agent.description}</p>
                        </div>
                        {isCurrent && (
                          <div className="ml-auto shrink-0">
                            <Loader2 className="h-3 w-3 text-violet-400 animate-spin" />
                          </div>
                        )}
                        {isActive && !isCurrent && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <AgentGraph
                  activeAgents={activeAgents}
                  messages={messages}
                  currentAgentId={currentAgentId}
                />

                {/* Rounds */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-400 font-medium shrink-0">Rounds:</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(r => (
                      <button
                        key={r}
                        onClick={() => setRounds(r)}
                        disabled={isRunning}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                          rounds === r ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Circuit Breaker Input */}
            <CircuitBreakerInput onInject={injectManualBreaker} disabled={false} />

            {/* Loop Warning */}
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

            {/* Session Output */}
            {messages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-300">Session Output</p>
                  <Button variant="ghost" size="sm" onClick={copySession} className="h-7 px-2 text-zinc-500 hover:text-white">
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