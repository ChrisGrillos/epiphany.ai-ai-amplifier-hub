import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

import VaultSidebar from '@/components/vault/VaultSidebar';
import HomeMainContent from '@/components/home/HomeMainContent';
import HomeModals from '@/components/home/HomeModals';
import useAuth from '@/hooks/useAuth';
import useVaultSession from '@/hooks/useVaultSession';
import useSynthesis from '@/hooks/useSynthesis';
import useEpi from '@/hooks/useEpi';
import useSessionManager from '@/hooks/useSessionManager';
import useGuardian from '@/hooks/useGuardian';
import useMessaging from '@/hooks/useMessaging';
import useTutorial from '@/hooks/useTutorial';
import useModalState from '@/hooks/useModalState';
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
      <VaultSidebar
        vaults={vaults}
        activeVaultId={activeVault?.id}
        onSelectVault={handleSelectVault}
        onCreateVault={() => setShowCreateVault(true)}
      />

      <HomeMainContent
        activeVault={activeVault}
        activeMainTab={activeMainTab}
        setActiveMainTab={setActiveMainTab}
        setShowMultiAgent={setShowMultiAgent}
        setShowSocialPlugin={setShowSocialPlugin}
        setShowMergeLayer={setShowMergeLayer}
        setShowMultiApiSetup={setShowMultiApiSetup}
        setShowCreateVault={setShowCreateVault}
        setShowSummary={setShowSummary}
        handleEndSession={handleEndSession}
        apiKey={apiKey}
        messages={messages}
        handleStartPrompt={handleStartPrompt}
        activeSession={activeSession}
        handleUpdateInsights={handleUpdateInsights}
        setShowReferencesList={setShowReferencesList}
        setShowImportChat={setShowImportChat}
        handleExportContextPack={handleExportContextPack}
        setShowGuardian={setShowGuardian}
        epiLevel={epiLevel}
        setShowEpiChat={setShowEpiChat}
        setShowCalendarExport={setShowCalendarExport}
        setShowEmailDraft={setShowEmailDraft}
        setShowArchival={setShowArchival}
        setShowMembers={setShowMembers}
        references={references}
        handleCopyLivingSummary={handleCopyLivingSummary}
        handleCopySessionThread={handleCopySessionThread}
        handleCopyContextPack={handleCopyContextPack}
        lastContextPack={lastContextPack}
        selectedReferenceIds={selectedReferenceIds}
        isLoading={isLoading}
        streamingContent={streamingContent}
        messagesEndRef={messagesEndRef}
        toggleReferenceSelection={toggleReferenceSelection}
        sessionAutoSaved={sessionAutoSaved}
        activeTab={activeTab}
        isSynthesizing={isSynthesizing}
        handleSendMessage={handleSendMessage}
        setActiveTab={setActiveTab}
      />

      <HomeModals
        showCreateVault={showCreateVault}
        setShowCreateVault={setShowCreateVault}
        createVaultMutation={createVaultMutation}
        showApiKeySetup={showApiKeySetup}
        setShowApiKeySetup={setShowApiKeySetup}
        handleSaveApiKey={handleSaveApiKey}
        apiKey={apiKey}
        showSummary={showSummary}
        setShowSummary={setShowSummary}
        activeVault={activeVault}
        handleCheckInsights={handleCheckInsights}
        setActiveTab={setActiveTab}
        showSynthesisReview={showSynthesisReview}
        setShowSynthesisReview={setShowSynthesisReview}
        proposedSummary={proposedSummary}
        handleAcceptSynthesis={handleAcceptSynthesis}
        handleRejectSynthesis={handleRejectSynthesis}
        isSynthesizing={isSynthesizing}
        showAddReference={showAddReference}
        setShowAddReference={setShowAddReference}
        queryClient={queryClient}
        showReferencesList={showReferencesList}
        setShowReferencesList={setShowReferencesList}
        references={references}
        handleDeleteReference={handleDeleteReference}
        handleSendMessage={handleSendMessage}
        showReferenceDiff={showReferenceDiff}
        setShowReferenceDiff={setShowReferenceDiff}
        pendingReferenceDiff={pendingReferenceDiff}
        handleAcceptReferenceDiff={handleAcceptReferenceDiff}
        showImportChat={showImportChat}
        setShowImportChat={setShowImportChat}
        handleImportWebChat={handleImportWebChat}
        messages={messages}
        showGuardian={showGuardian}
        setShowGuardian={setShowGuardian}
        guardianNotes={guardianNotes}
        guardianLoading={guardianLoading}
        runGuardianCheck={runGuardianCheck}
        setGuardianNotes={setGuardianNotes}
        showCalendarExport={showCalendarExport}
        setShowCalendarExport={setShowCalendarExport}
        showEmailDraft={showEmailDraft}
        setShowEmailDraft={setShowEmailDraft}
        showEpiSettings={showEpiSettings}
        setShowEpiSettings={setShowEpiSettings}
        epiLevel={epiLevel}
        handleUpdateEpiLevel={handleUpdateEpiLevel}
        showEpiChat={showEpiChat}
        setShowEpiChat={setShowEpiChat}
        epiNudge={epiNudge}
        setEpiNudge={setEpiNudge}
        isLoading={isLoading}
        activeTab={activeTab}
        showTutorial={showTutorial}
        setShowTutorial={setShowTutorial}
        tutorialProgress={tutorialProgress}
        handleUpdateTutorialProgress={handleUpdateTutorialProgress}
        handleCompleteTutorial={handleCompleteTutorial}
        showQuickTips={showQuickTips}
        setShowQuickTips={setShowQuickTips}
        showMultiApiSetup={showMultiApiSetup}
        setShowMultiApiSetup={setShowMultiApiSetup}
        showMultiAgent={showMultiAgent}
        setShowMultiAgent={setShowMultiAgent}
        showSocialPlugin={showSocialPlugin}
        setShowSocialPlugin={setShowSocialPlugin}
        showMembers={showMembers}
        setShowMembers={setShowMembers}
        showMergeLayer={showMergeLayer}
        setShowMergeLayer={setShowMergeLayer}
        showArchival={showArchival}
        setShowArchival={setShowArchival}
        refetchReferences={refetchReferences}
        handleEndSession={handleEndSession}
        setPendingReferenceDiff={setPendingReferenceDiff}
        insightsLoading={insightsLoading}
      />
    </div>
  );
}

