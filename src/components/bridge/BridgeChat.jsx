import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, User, Sparkles, Bot, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function BridgeChat({ conversation, vault, onBack }) {
  const [messages, setMessages] = useState(conversation.messages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      sender: 'You',
      sender_type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Get context based on level
      let contextForEpi = '';
      if (conversation.context_level === 'summary_only') {
        contextForEpi = `Living Summary:\n${vault.living_summary || 'No summary yet'}`;
      } else if (conversation.context_level === 'full_context') {
        contextForEpi = `Full Vault Context:\n${vault.living_summary}\n\nRecent activity: ${JSON.stringify(updatedMessages.slice(-5))}`;
      }

      // Epi processes and adds context
      const epiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Epi in a bridge conversation. Provide concise context coordination.

User said: "${input}"

${contextForEpi}

Bridge context level: ${conversation.context_level}

Provide a brief, helpful response that bridges context appropriately.`
      });

      const epiMessage = {
        sender: 'Epi',
        sender_type: 'epi',
        content: epiResponse.text || String(epiResponse),
        timestamp: new Date().toISOString(),
        context_summary: 'Context mediated by Epi'
      };

      const finalMessages = [...updatedMessages, epiMessage];
      setMessages(finalMessages);

      // Update conversation in database
      await base44.entities.BridgeConversation.update(conversation.id, {
        messages: finalMessages
      });
    } catch (error) {
      toast.error('Failed to send message');
      console.error(error);
    }

    setIsLoading(false);
  };

  const getAvatar = (senderType) => {
    switch (senderType) {
      case 'user':
        return <User className="h-4 w-4 text-emerald-400" />;
      case 'epi':
        return <Sparkles className="h-4 w-4 text-violet-400" />;
      case 'external_llm':
        return <Bot className="h-4 w-4 text-blue-400" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-3 px-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
        <Shield className="h-4 w-4 text-violet-400" />
        <div>
          <h3 className="text-sm font-medium text-white">{conversation.title}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
              {conversation.context_level.replace('_', ' ')}
            </Badge>
            {conversation.participants?.map((p, idx) => (
              <span key={idx} className="text-xs text-zinc-500">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Shield className="h-16 w-16 text-zinc-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Bridge Conversation</h3>
            <p className="text-sm text-zinc-400 max-w-md">
              Experimental bridge preview. Epi simulates context mediation based on your selected settings.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  {getAvatar(msg.sender_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white">{msg.sender}</span>
                    {msg.context_summary && (
                      <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-400">
                        Context mediated
                      </Badge>
                    )}
                  </div>
                  <div className="bg-zinc-800 rounded-lg px-4 py-2.5">
                    <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none">
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
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
            placeholder="Type your message..."
            className="bg-zinc-800 border-zinc-700 text-white resize-none"
            rows={2}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-emerald-600 hover:bg-emerald-500 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
