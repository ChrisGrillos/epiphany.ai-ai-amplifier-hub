import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import AddReferenceModal from '@/components/references/AddReferenceModal';
import ReferencesList from '@/components/references/ReferencesList';
import AttachReferencesSelector from '@/components/references/AttachReferencesSelector';
import ReferenceDiffReview from '@/components/references/ReferenceDiffReview';
import ImportWebChatModal from '@/components/import/ImportWebChatModal';
import GuardianPanel from '@/components/guardian/GuardianPanel';
import CalendarExport from '@/components/calendar/CalendarExport';
import EmailDraft from '@/components/email/EmailDraft';
import DragScrollArea from '@/components/ui/DragScrollArea';
import EpiSettings from '@/components/epi/EpiSettings';
import EpiChat from '@/components/epi/EpiChat';
import EpiNudge from '@/components/epi/EpiNudge';
import EpiAvatar from '@/components/epi/EpiAvatar';
import MoltbookHub from '@/components/moltbook/MoltbookHub';
import WorkflowsPanel from '@/components/workflow/WorkflowsPanel';
import MultiApiKeySetup from '@/components/settings/MultiApiKeySetup';
import OnboardingTutorial from '@/components/tutorial/OnboardingTutorial';
import QuickTips from '@/components/tutorial/QuickTips';
import BridgeConversations from '@/components/bridge/BridgeConversations';
import ReferenceArchival from '@/components/references/ReferenceArchival';
import CrossModelMergeLayer from '@/components/merge/CrossModelMergeLayer';
import MultiAgentSession from '@/components/multiagent/MultiAgentSession';
import SocialMediaPlugin from '@/components/social/SocialMediaPlugin';
import ContextIndicator from '@/components/chat/ContextIndicator';
import VaultMembersPanel from '@/components/collab/VaultMembersPanel';
import useAuth from '@/hooks/useAuth';
import useVaultSession from '@/hooks/useVaultSession';
import useSynthesis from '@/hooks/useSynthesis';
import useEpi from '@/hooks/useEpi';
import useSessionManager from '@/hooks/useSessionManager';
import useGuardian from '@/hooks/useGuardian';
import useMessaging from '@/hooks/useMessaging';
import useTutorial from '@/hooks/useTutorial';
import useModalState from '@/hooks/useModalState';
import { getActiveProvider } from '@/components/epi/workflowEngine';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  
  // State
  
  
  // Modals
  const { modals, setModalOpen } = useModalState({
    createVault: false,
    apiKeySetup: false,
    summary: false,
    addReference: false,
    referencesList: false,
    referenceDiff: false,
    importChat: false,
    calendarExport: false,
    emailDraft: false,
    epiSettings: false,
    epiChat: false,
    archival: false,
    multiApiSetup: false,
    mergeLayer: false,
    multiAgent: false,
    socialPlugin: false,
    members: false,
  });
  const showCreateVault = modals.createVault;
  const setShowCreateVault = (value) => setModalOpen('createVault', value);
  const showApiKeySetup = modals.apiKeySetup;
  const setShowApiKeySetup = (value) => setModalOpen('apiKeySetup', value);
  const showSummary = modals.summary;
  const setShowSummary = (value) => setModalOpen('summary', value);
  const showAddReference = modals.addReference;
  const setShowAddReference = (value) => setModalOpen('addReference', value);
  const showReferencesList = modals.referencesList;
  const setShowReferencesList = (value) => setModalOpen('referencesList', value);
  const showReferenceDiff = modals.referenceDiff;
  const setShowReferenceDiff = (value) => setModalOpen('referenceDiff', value);
  const showImportChat = modals.importChat;
  const setShowImportChat = (value) => setModalOpen('importChat', value);
  const showCalendarExport = modals.calendarExport;
  const setShowCalendarExport = (value) => setModalOpen('calendarExport', value);
  const showEmailDraft = modals.emailDraft;
  const setShowEmailDraft = (value) => setModalOpen('emailDraft', value);
  const showEpiSettings = modals.epiSettings;
  const setShowEpiSettings = (value) => setModalOpen('epiSettings', value);
  const showEpiChat = modals.epiChat;
  const setShowEpiChat = (value) => setModalOpen('epiChat', value);
  const [activeMainTab, setActiveMainTab] = useState('chat');
  const showArchival = modals.archival;
  const setShowArchival = (value) => setModalOpen('archival', value);
  const showMultiApiSetup = modals.multiApiSetup;
  const setShowMultiApiSetup = (value) => setModalOpen('multiApiSetup', value);
  const showMergeLayer = modals.mergeLayer;
  const setShowMergeLayer = (value) => setModalOpen('mergeLayer', value);
  const showMultiAgent = modals.multiAgent;
  const setShowMultiAgent = (value) => setModalOpen('multiAgent', value);
  const showSocialPlugin = modals.socialPlugin;
  const setShowSocialPlugin = (value) => setModalOpen('socialPlugin', value);
  const showMembers = modals.members;
  const setShowMembers = (value) => setModalOpen('members', value);
  
  // Synthesis
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // References
  const [pendingReferenceDiff, setPendingReferenceDiff] = useState(null);
  
  const [apiKey, setApiKey] = useState(true); // non-null signals "key may exist server-side"
  const { currentUser, db } = useAuth();

  const {
    vaults,
    vaultsLoading,
    activeVault,
    setActiveVault,
    activeSession,
    setActiveSession,
    messages,
    setMessages,
    references,
    refetchReferences,
    selectedReferenceIds,
    setSelectedReferenceIds,
    sessionAutoSaved,
    setSessionAutoSaved,
    createVaultMutation,
    updateVaultMutation,
    startNewSession,
    handleSelectVault,
    toggleReferenceSelection,
    handleDeleteReference,
  } = useVaultSession({ currentUser, db });

  const {
    epiLevel,
    epiNudge,
    setEpiNudge,
    handleUpdateEpiLevel,
  } = useEpi({ activeVault, db });

  const {
    guardianNotes,
    setGuardianNotes,
    guardianLoading,
    showGuardian,
    setShowGuardian,
    runGuardianCheck,
  } = useGuardian({ activeVault, messages });

  const {
    showTutorial,
    setShowTutorial,
    showQuickTips,
    setShowQuickTips,
    tutorialProgress,
    handleUpdateTutorialProgress,
    handleCompleteTutorial,
  } = useTutorial();

  const { sessionManagerRef, markAutoSavedSessionSuperseded } = useSessionManager({
    activeVault,
    activeSession,
    messages,
    selectedReferenceIds,
    references,
    epiLevel,
    setMessages,
    setActiveSession,
    setSelectedReferenceIds,
    setSessionAutoSaved,
  });

  const {
    isLoading,
    streamingContent,
    activeTab,
    setActiveTab,
    lastContextPack,
    handleSendMessage,
    handleStartPrompt,
    handleImportWebChat,
    handleCopyLivingSummary,
    handleCopySessionThread,
    handleCopyContextPack,
    handleExportContextPack,
  } = useMessaging({
    activeVault,
    messages,
    setMessages,
    activeSession,
    setActiveSession,
    references,
    selectedReferenceIds,
    epiLevel,
    db,
    sessionManagerRef,
    apiKey,
    setPendingReferenceDiff,
    setShowReferenceDiff,
    onRunSynthesis: () => handleEndSession(),
  });

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSaveApiKey = async () => {
    // Keys are now saved via workflowEngine.saveProviderKey -> llmProxy backend
    toast.success('API key saved securely');
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

  const handleAcceptReferenceDiff = async (newContent) => {
    if (!pendingReferenceDiff) return;
    
    try {
      await base44.entities.Reference.update(pendingReferenceDiff.reference.id, {
        full_content: newContent,
        excerpt: newContent.substring(0, 500),
      });
      
      queryClient.invalidateQueries({ queryKey: ['references'] });
      setShowReferenceDiff(false);
      setPendingReferenceDiff(null);
      toast.success('Reference updated');
    } catch (error) {
      toast.error('Failed to update reference');
    }
  };

  const {
    proposedSummary,
    isSynthesizing,
    showSynthesisReview,
    setShowSynthesisReview,
    handleEndSession,
    handleAcceptSynthesis,
    handleRejectSynthesis,
  } = useSynthesis({
    activeVault,
    setActiveVault,
    messages,
    setMessages,
    activeSession,
    selectedReferenceIds,
    setSelectedReferenceIds,
    references,
    updateVaultMutation,
    epiLevel,
    sessionManagerRef,
    runGuardianCheck,
    setEpiNudge,
    onSessionFinalized: markAutoSavedSessionSuperseded,
  });

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
        {/* Tab Navigation */}
        {activeVault && (
          <div className="border-b border-zinc-800 bg-zinc-950/50">
            <div className="flex gap-1 px-4 pt-2">
              <button
                onClick={() => setActiveMainTab('chat')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeMainTab === 'chat'
                    ? 'bg-zinc-900 text-white border-t border-x border-zinc-800'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveMainTab('moltbook')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeMainTab === 'moltbook'
                    ? 'bg-zinc-900 text-white border-t border-x border-zinc-800'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Moltbook Agents
              </button>
              <button
                onClick={() => setActiveMainTab('bridge')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeMainTab === 'bridge'
                    ? 'bg-zinc-900 text-white border-t border-x border-zinc-800'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Bridge
              </button>
              <button
                onClick={() => setActiveMainTab('workflows')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeMainTab === 'workflows'
                    ? 'bg-zinc-900 text-white border-t border-x border-zinc-800'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Workflows
              </button>
              <button
                onClick={() => setShowMultiAgent(true)}
                className="ml-auto px-3 py-1.5 text-xs text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>??</span> Agents
              </button>
              <button
                onClick={() => setShowSocialPlugin(true)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>??</span> Social
              </button>
              <button
                onClick={() => setShowMergeLayer(true)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>??</span> Merge
              </button>
              <button
                onClick={() => setShowMultiApiSetup(true)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>??</span> API Keys
              </button>
            </div>
          </div>
        )}

        {!activeVault ? (
          <DragScrollArea className="h-full" disabled={false}>
            <WelcomeScreen
              onCreateVault={() => setShowCreateVault(true)}
              onSetupApiKey={() => setShowMultiApiSetup(true)}
              hasApiKey={!!apiKey}
              onOpenSummary={() => setShowSummary(true)}
              onEndSession={handleEndSession}
            />
          </DragScrollArea>
        ) : activeMainTab === 'moltbook' ? (
          <MoltbookHub activeVault={activeVault} />
        ) : activeMainTab === 'bridge' ? (
          <BridgeConversations vault={activeVault} />
        ) : activeMainTab === 'workflows' ? (
          <WorkflowsPanel vault={activeVault} />
        ) : (
          <>
            {/* Header */}
            <SessionHeader
              vault={activeVault}
              session={activeSession}
              onEndSession={handleEndSession}
              onViewSummary={() => setShowSummary(true)}
              onUpdateInsights={handleUpdateInsights}
              onShowReferences={() => setShowReferencesList(true)}
              onShowImport={() => setShowImportChat(true)}
              onShowExport={handleExportContextPack}
              onShowGuardian={() => setShowGuardian(true)}
              onShowEpiChat={epiLevel >= 3 ? () => setShowEpiChat(true) : null}
              onShowCalendar={() => setShowCalendarExport(true)}
              onShowEmail={() => setShowEmailDraft(true)}
              onShowArchival={() => setShowArchival(true)}
              onShowMembers={() => setShowMembers(true)}
              hasMessages={messages.length > 0}
              referencesCount={references.length}
              onCopyLivingSummary={handleCopyLivingSummary}
              onCopySessionThread={handleCopySessionThread}
              onCopyContextPack={handleCopyContextPack}
              lastContextPack={lastContextPack}
            />

            {/* Context Indicator */}
            <ContextIndicator
              vault={activeVault}
              references={references}
              selectedIds={selectedReferenceIds}
              messages={messages}
            />

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              {messages.length === 0 ? (
                <DragScrollArea className="h-full">
                  <EmptyState
                    vaultName={activeVault.name}
                    onStartPrompt={handleStartPrompt}
                  />
                </DragScrollArea>
              ) : (
                <DragScrollArea className="h-full">
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
                </DragScrollArea>
              )}
            </div>

            {/* Input */}
            <div className="relative">
              <div className="absolute left-4 bottom-4 z-10 flex items-center gap-2">
                <AttachReferencesSelector
                  references={references}
                  selectedIds={selectedReferenceIds}
                  onToggle={toggleReferenceSelection}
                  disabled={(activeTab === 'api' && !apiKey) || isLoading}
                />
                {sessionAutoSaved && (
                  <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400">
                    Session auto-saved
                  </div>
                )}
              </div>
              <ChatInput
                onSend={handleSendMessage}
                disabled={activeTab === 'api' && !apiKey}
                isLoading={isLoading || isSynthesizing}
                epiLevel={epiLevel}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                placeholder={
                  activeTab === 'api' 
                    ? (!apiKey ? "Configure your API key to start..." : "Message Grok…")
                    : "Talk to Epi… (paste a web chat, request a context pack, or ask for a vault summary)"
                }
              />
            </div>
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
        vaultId={activeVault?.id}
        onCheckInsights={handleCheckInsights}
        insightsLoading={insightsLoading}
        onSuggestionAction={(suggestion) => {
          // Handle suggestion actions
          if (suggestion.handler === 'condenseSummary') {
            setActiveTab('epi');
            setShowSummary(false);
            toast.info('Ask Epi to condense your summary');
          } else if (suggestion.handler === 'refineSummary') {
            setActiveTab('api');
            setShowSummary(false);
            toast.info('Ask your API to refine the summary');
          }
        }}
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

      <AddReferenceModal
        open={showAddReference}
        onOpenChange={setShowAddReference}
        vaultId={activeVault?.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['references'] });
          setShowAddReference(false);
        }}
      />

      <ReferencesList
        open={showReferencesList}
        onOpenChange={setShowReferencesList}
        references={references}
        vaultName={activeVault?.name}
        onAddReference={() => {
          setShowReferencesList(false);
          setShowAddReference(true);
        }}
        onDeleteReference={handleDeleteReference}
        onSuggestionAction={(suggestion) => {
          if (suggestion.handler === 'prepareContextPackWithReferences') {
            setShowReferencesList(false);
            setActiveTab('epi');
            handleSendMessage({ 
              content: 'Prepare a context pack using my attached references', 
              image_urls: [], 
              target: 'epi' 
            });
          }
        }}
      />

      <ReferenceDiffReview
        open={showReferenceDiff}
        onOpenChange={setShowReferenceDiff}
        reference={pendingReferenceDiff?.reference}
        proposedContent={pendingReferenceDiff?.proposedContent}
        onAccept={handleAcceptReferenceDiff}
        onReject={() => {
          setShowReferenceDiff(false);
          setPendingReferenceDiff(null);
          toast.info('Reference changes rejected');
        }}
        isProcessing={false}
      />

      <ImportWebChatModal
        open={showImportChat}
        onOpenChange={setShowImportChat}
        onImport={handleImportWebChat}
        hasActiveSession={messages.length > 0}
      />

      <GuardianPanel
        open={showGuardian}
        onOpenChange={setShowGuardian}
        notes={guardianNotes}
        isLoading={guardianLoading}
        onCheckNow={() => runGuardianCheck()}
        onDismissNote={(idx) => setGuardianNotes(prev => prev.filter((_, i) => i !== idx))}
        vaultName={activeVault?.name}
      />

      <CalendarExport
        open={showCalendarExport}
        onOpenChange={setShowCalendarExport}
        livingSummary={activeVault?.living_summary}
        apiKey={apiKey}
      />

      <EmailDraft
        open={showEmailDraft}
        onOpenChange={setShowEmailDraft}
        livingSummary={activeVault?.living_summary}
        vaultName={activeVault?.name}
        apiKey={apiKey}
      />

      <EpiSettings
        open={showEpiSettings}
        onOpenChange={setShowEpiSettings}
        epiLevel={epiLevel}
        onLevelChange={handleUpdateEpiLevel}
      />

      {epiLevel >= 3 && (
        <EpiChat
          open={showEpiChat}
          onOpenChange={setShowEpiChat}
          vault={activeVault}
          apiKey={apiKey}
          epiLevel={epiLevel}
        />
      )}

      {epiLevel === 4 && epiNudge && (
        <EpiNudge
          nudge={epiNudge}
          onDismiss={() => setEpiNudge(null)}
          onAction={() => {
            if (epiNudge.type === 'long_session') handleEndSession();
            setEpiNudge(null);
          }}
        />
      )}

      {/* Epi Avatar - Bottom Left Corner — reactive state */}
      <div className="fixed bottom-6 left-6 z-50">
        <EpiAvatar
          onClick={() => setShowEpiSettings(true)}
          state={
            epiNudge
              ? 'alert'
              : isSynthesizing
              ? 'thinking'
              : isLoading
              ? (activeTab === 'epi' ? 'thinking' : 'speaking')
              : 'idle'
          }
        />
      </div>

      {/* Tutorial */}
      <OnboardingTutorial
        open={showTutorial}
        onOpenChange={setShowTutorial}
        tutorialProgress={tutorialProgress}
        onUpdateProgress={handleUpdateTutorialProgress}
        onComplete={handleCompleteTutorial}
      />

      {/* Quick Tips */}
      {showQuickTips && (
        <QuickTips onDismiss={() => setShowQuickTips(false)} />
      )}

      {/* Multi API Key Setup */}
      <MultiApiKeySetup
        open={showMultiApiSetup}
        onOpenChange={setShowMultiApiSetup}
        onProviderChange={() => {}}
      />

      {/* Multi-Agent Session */}
      <MultiAgentSession
        open={showMultiAgent}
        onOpenChange={setShowMultiAgent}
        vault={activeVault}
      />

      {/* Social Media Plugin */}
      <SocialMediaPlugin
        open={showSocialPlugin}
        onOpenChange={setShowSocialPlugin}
        vault={activeVault}
        isSubscribed={false}
      />

      {/* Vault Members Panel */}
      <VaultMembersPanel
        open={showMembers}
        onOpenChange={setShowMembers}
        vault={activeVault}
      />

      {/* Cross-Model Merge Layer */}
      <CrossModelMergeLayer
        open={showMergeLayer}
        onOpenChange={setShowMergeLayer}
      />

      {/* Reference Archival */}
      <ReferenceArchival
        open={showArchival}
        onOpenChange={setShowArchival}
        vaultId={activeVault?.id}
        references={references}
        onArchiveComplete={() => {
          refetchReferences();
          toast.success('References archived successfully');
        }}
      />
    </div>
  );
}


