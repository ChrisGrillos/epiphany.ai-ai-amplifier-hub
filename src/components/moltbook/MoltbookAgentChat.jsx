import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Bot, User, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function MoltbookAgentChat({ agent, vault, apiKey, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context for the agent
      const context = `Vault: ${vault.name}\nLiving Summary:\n${vault.living_summary || 'No summary yet'}\n\nUser message: ${input}`;

      // Call Moltbook agent (simulated via LLM for now)
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are ${agent.agent_name}, a Moltbook agent with the following capabilities: ${agent.capabilities?.join(', ') || 'general assistance'}.\n\n${context}`
      });

      const agentMessage = {
        role: 'assistant',
        content: response.text || response.output || String(response),
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, agentMessage]);

      // Update last interaction
      await base44.entities.MoltbookAgent.update(agent.id, {
        last_interaction: new Date().toISOString()
      });
    } catch (error) {
      toast.error('Failed to communicate with agent');
      console.error(error);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-3 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
        <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Bot className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">{agent.agent_name}</h3>
          <p className="text-xs text-zinc-500">{agent.description || 'Moltbook Agent'}</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-16 w-16 text-zinc-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Start Conversation
            </h3>
            <p className="text-sm text-zinc-400 max-w-md">
              Chat with {agent.agent_name}. The agent has access to your vault context.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-violet-400" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-white'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-emerald-400" />
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${agent.agent_name}...`}
            className="bg-zinc-800 border-zinc-700 text-white resize-none"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-emerald-600 hover:bg-emerald-500 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}