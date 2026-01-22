import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

import VaultSidebar from '@/components/vault/VaultSidebar';
import CreateVaultModal from '@/components/vault/CreateVaultModal';
import WelcomeScreen from '@/components/welcome/WelcomeScreen';
import EmptyState from '@/components/chat/EmptyState';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import SessionHeader from '@/components/chat/SessionHeader';
import LiveSummaryView from '@/components/summary/LiveSummaryView';
import SynthesisReview from '@/components/synthesis/SynthesisReview';
import ApiKeySetup from '@/components/settings/ApiKeySetup';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

const SYNTHESIS_PROMPT = `You are updating a Living Summary for an ongoing workspace.

You will receive:
1) CURRENT LIVING SUMMARY
2) NEW SESSION TRANSCRIPT

Your task:
- Add only NEW durable information (facts, decisions, constraints, definitions, plans).
- Remove or update anything that is now outdated or contradicted.
- Deduplicate aggressively.
- Preserve clarity and a stable structure.

Rules:
- Prefer the most recent information if there is a conflict.
- If uncertainty remains, label it explicitly as "Uncertain".
- ⭐ Do NOT rephrase existing content unless its meaning has changed.
- ⭐ Do NOT make stylistic edits for readability alone.
- Keep total length under 1600 tokens.
- Output ONLY the updated Living Summary using the exact structure below.
- No commentary, no explanations.

STRUCTURE:
## Objective
## Key Facts
## Decisions
## Open Questions
## Next Actions

CURRENT LIVING SUMMARY:
{current_summary}

NEW SESSION TRANSCRIPT:
{transcript}`;

export default function Home() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  
  // State
  const [activeVault, setActiveVault] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  
  // Modals
  const [showCreateVault, setShowCreateVault] = useState(false);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSynthesisReview, setShowSynthesisReview] = useState(false);
  
  // Synthesis
  const [proposedSummary, setProposedSummary] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // API Key stored in localStorage
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('grok_api_key') || '');

  // Queries
  const { data: vaults = [], isLoading: vaultsLoading } = useQuery({
    queryKey: ['vaults'],
    queryFn: () => base44.entities.Vault.list('-last_accessed'),
  });

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Create vault mutation
  const createVaultMutation = useMutation({
    mutationFn: (data) => base44.entities.Vault.create(data),
    onSuccess: (newVault) => {
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
      setActiveVault(newVault);
      startNewSession(newVault);
      toast.success('Vault created');
    },
  });

  // Update vault mutation
  const updateVaultMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vault.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
    },
  });

  const startNewSession = (vault) => {
    setMessages([]);
    setActiveSession({
      vault_id: vault.id,
      started_at: new Date().toISOString(),
      messages: []
    });
    // Update last accessed
    updateVaultMutation.mutate({
      id: vault.id,
      data: { last_accessed: new Date().toISOString() }
    });
  };

  const handleSelectVault = (vault) => {
    setActiveVault(vault);
    startNewSession(vault);
  };

  const handleSaveApiKey = async (key) => {
    localStorage.setItem('grok_api_key', key);
    setApiKey(key);
    toast.success('API key saved');
  };

  const handleSendMessage = async ({ content, image_urls }) => {
    if (!apiKey) {
      setShowApiKeySetup(true);
      toast.error('Please configure your API key first');
      return;
    }

    const userMessage = {
      role: 'user',
      content,
      image_urls,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      // Build system prompt with Living Summary
      const systemPrompt = `You are Epiphany, an AI thinking amplifier. You help users explore ideas, make decisions, and organize their thoughts.

Context from Living Summary:
${activeVault?.living_summary || 'No summary yet.'}

Be concise, insightful, and helpful. Focus on durable insights that could be added to the Living Summary later.`;

      // Build conversation history
      const conversationHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');

      const fullPrompt = conversationHistory 
        ? `${conversationHistory}\n\nUser: ${content}`
        : content;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\n${fullPrompt}`,
        file_urls: image_urls?.length > 0 ? image_urls : undefined,
      });

      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response');
      console.error(error);
    }

    setIsLoading(false);
  };

  const handleEndSession = async () => {
    if (!apiKey) {
      setShowApiKeySetup(true);
      return;
    }

    if (messages.length === 0) {
      toast.error('No messages to synthesize');
      return;
    }

    setIsSynthesizing(true);

    try {
      // Build transcript
      const transcript = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      const prompt = SYNTHESIS_PROMPT
        .replace('{current_summary}', activeVault?.living_summary || 'No existing summary.')
        .replace('{transcript}', transcript);

      const synthesized = await base44.integrations.Core.InvokeLLM({
        prompt,
      });

      setProposedSummary(synthesized);
      setShowSynthesisReview(true);
    } catch (error) {
      toast.error('Synthesis failed');
      console.error(error);
    }

    setIsSynthesizing(false);
  };

  const handleAcceptSynthesis = async (finalSummary) => {
    try {
      await updateVaultMutation.mutateAsync({
        id: activeVault.id,
        data: { 
          living_summary: finalSummary,
          last_accessed: new Date().toISOString()
        }
      });

      // Save session to history
      await base44.entities.Session.create({
        vault_id: activeVault.id,
        title: `Session ${new Date().toLocaleDateString()}`,
        messages,
        status: 'completed',
        started_at: activeSession?.started_at,
        ended_at: new Date().toISOString(),
        synthesis_result: {
          proposed_summary: finalSummary,
          accepted: true
        }
      });

      setActiveVault(prev => ({ ...prev, living_summary: finalSummary }));
      setShowSynthesisReview(false);
      setMessages([]);
      toast.success('Living Summary updated');
    } catch (error) {
      toast.error('Failed to save summary');
    }
  };

  const handleRejectSynthesis = () => {
    setShowSynthesisReview(false);
    toast.info('Synthesis rejected - session continues');
  };

  const handleUpdateInsights = (level) => {
    updateVaultMutation.mutate({
      id: activeVault.id,
      data: { live_insights_level: level }
    });
    setActiveVault(prev => ({ ...prev, live_insights_level: level }));
    toast.success(`Insights level set to ${level}`);
  };

  const handleCheckInsights = async () => {
    if (!apiKey) {
      setShowApiKeySetup(true);
      return;
    }

    setInsightsLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Review this Living Summary and suggest any updates based on current knowledge. Be specific about what should be added or modified.

Living Summary:
${activeVault?.living_summary}`,
        add_context_from_internet: true,
      });
      
      toast.info('Insights check complete - see summary panel');
      // Could show in a dedicated insights panel
    } catch (error) {
      toast.error('Failed to check insights');
    }
    setInsightsLoading(false);
  };

  const handleStartPrompt = (suggestion) => {
    // This would populate the input - for now just triggers a message
    handleSendMessage({ content: suggestion, image_urls: [] });
  };

  // Render
  if (vaultsLoading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      {/* Sidebar */}
      <VaultSidebar
        vaults={vaults}
        activeVaultId={activeVault?.id}
        onSelectVault={handleSelectVault}
        onCreateVault={() => setShowCreateVault(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeVault ? (
          <WelcomeScreen
            onCreateVault={() => setShowCreateVault(true)}
            onSetupApiKey={() => setShowApiKeySetup(true)}
            hasApiKey={!!apiKey}
          />
        ) : (
          <>
            {/* Header */}
            <SessionHeader
              vault={activeVault}
              session={activeSession}
              onEndSession={handleEndSession}
              onViewSummary={() => setShowSummary(true)}
              onUpdateInsights={handleUpdateInsights}
              hasMessages={messages.length > 0}
            />

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              {messages.length === 0 ? (
                <EmptyState
                  vaultName={activeVault.name}
                  onStartPrompt={handleStartPrompt}
                />
              ) : (
                <ScrollArea className="h-full">
                  <div className="divide-y divide-zinc-800/30">
                    {messages.map((msg, idx) => (
                      <MessageBubble
                        key={idx}
                        message={msg}
                        isStreaming={false}
                      />
                    ))}
                    {isLoading && (
                      <MessageBubble
                        message={{ role: 'assistant', content: streamingContent || 'Thinking...' }}
                        isStreaming={true}
                      />
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>
              )}
            </div>

            {/* Input */}
            <ChatInput
              onSend={handleSendMessage}
              disabled={!apiKey}
              isLoading={isLoading || isSynthesizing}
              placeholder={
                !apiKey 
                  ? "Configure your API key to start..." 
                  : "Start thinking with Epiphany..."
              }
            />
          </>
        )}
      </div>

      {/* Modals */}
      <CreateVaultModal
        open={showCreateVault}
        onOpenChange={setShowCreateVault}
        onCreate={createVaultMutation.mutateAsync}
      />

      <ApiKeySetup
        open={showApiKeySetup}
        onOpenChange={setShowApiKeySetup}
        onSave={handleSaveApiKey}
        existingKey={apiKey}
      />

      <LiveSummaryView
        open={showSummary}
        onOpenChange={setShowSummary}
        summary={activeVault?.living_summary}
        vaultName={activeVault?.name}
        onCheckInsights={handleCheckInsights}
        insightsLoading={insightsLoading}
      />

      <SynthesisReview
        open={showSynthesisReview}
        onOpenChange={setShowSynthesisReview}
        currentSummary={activeVault?.living_summary}
        proposedSummary={proposedSummary}
        onAccept={handleAcceptSynthesis}
        onReject={handleRejectSynthesis}
        isProcessing={isSynthesizing}
      />
    </div>
  );
}