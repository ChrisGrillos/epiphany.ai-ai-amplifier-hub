import React from 'react';
import { toast } from 'sonner';
import CreateVaultModal from '@/components/vault/CreateVaultModal';
import LiveSummaryView from '@/components/summary/LiveSummaryView';
import SynthesisReview from '@/components/synthesis/SynthesisReview';
import AddReferenceModal from '@/components/references/AddReferenceModal';
import ReferencesList from '@/components/references/ReferencesList';
import ReferenceDiffReview from '@/components/references/ReferenceDiffReview';
import ImportWebChatModal from '@/components/import/ImportWebChatModal';
import GuardianPanel from '@/components/guardian/GuardianPanel';
import CalendarExport from '@/components/calendar/CalendarExport';
import EmailDraft from '@/components/email/EmailDraft';
import EpiSettings from '@/components/epi/EpiSettings';
import EpiChat from '@/components/epi/EpiChat';
import EpiNudge from '@/components/epi/EpiNudge';
import OnboardingTutorial from '@/components/tutorial/OnboardingTutorial';
import QuickTips from '@/components/tutorial/QuickTips';
import MultiApiKeySetup from '@/components/settings/MultiApiKeySetup';
import MultiAgentSession from '@/components/multiagent/MultiAgentSession';
import SocialMediaPlugin from '@/components/social/SocialMediaPlugin';
import VaultMembersPanel from '@/components/collab/VaultMembersPanel';
import CrossModelMergeLayer from '@/components/merge/CrossModelMergeLayer';
import ReferenceArchival from '@/components/references/ReferenceArchival';
import ApiKeySetup from '@/components/settings/ApiKeySetup';

export default function HomeModals({ home }) {
  const {
    showCreateVault,
    setShowCreateVault,
    createVaultMutation,
    showApiKeySetup,
    setShowApiKeySetup,
    handleSaveApiKey,
    apiKey,
    showSummary,
    setShowSummary,
    activeVault,
    handleCheckInsights,
    setActiveTab,
    showSynthesisReview,
    setShowSynthesisReview,
    proposedSummary,
    handleAcceptSynthesis,
    handleRejectSynthesis,
    isSynthesizing,
    showAddReference,
    setShowAddReference,
    queryClient,
    showReferencesList,
    setShowReferencesList,
    references,
    handleDeleteReference,
    handleSendMessage,
    showReferenceDiff,
    setShowReferenceDiff,
    pendingReferenceDiff,
    handleAcceptReferenceDiff,
    showImportChat,
    setShowImportChat,
    handleImportWebChat,
    messages,
    showGuardian,
    setShowGuardian,
    guardianNotes,
    guardianLoading,
    runGuardianCheck,
    onDismissGuardianNote,
    showCalendarExport,
    setShowCalendarExport,
    showEmailDraft,
    setShowEmailDraft,
    showEpiSettings,
    setShowEpiSettings,
    epiLevel,
    handleUpdateEpiLevel,
    showEpiChat,
    setShowEpiChat,
    epiNudge,
    setEpiNudge,
    showTutorial,
    setShowTutorial,
    tutorialProgress,
    handleUpdateTutorialProgress,
    handleCompleteTutorial,
    showQuickTips,
    onDismissQuickTips,
    showMultiApiSetup,
    setShowMultiApiSetup,
    showMultiAgent,
    setShowMultiAgent,
    showSocialPlugin,
    setShowSocialPlugin,
    showMembers,
    setShowMembers,
    showMergeLayer,
    setShowMergeLayer,
    showArchival,
    setShowArchival,
    refetchReferences,
    handleEndSession,
    setPendingReferenceDiff,
    insightsLoading,
  } = home;

  return (
    <>
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
              target: 'epi',
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
        onDismissNote={onDismissGuardianNote}
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

      <OnboardingTutorial
        open={showTutorial}
        onOpenChange={setShowTutorial}
        tutorialProgress={tutorialProgress}
        onUpdateProgress={handleUpdateTutorialProgress}
        onComplete={handleCompleteTutorial}
      />

      {showQuickTips && <QuickTips onDismiss={onDismissQuickTips} />}

      <MultiApiKeySetup
        open={showMultiApiSetup}
        onOpenChange={setShowMultiApiSetup}
      />

      <MultiAgentSession
        open={showMultiAgent}
        onOpenChange={setShowMultiAgent}
        vault={activeVault}
      />

      <SocialMediaPlugin
        open={showSocialPlugin}
        onOpenChange={setShowSocialPlugin}
        vault={activeVault}
        isSubscribed={false}
      />

      <VaultMembersPanel
        open={showMembers}
        onOpenChange={setShowMembers}
        vault={activeVault}
      />

      <CrossModelMergeLayer
        open={showMergeLayer}
        onOpenChange={setShowMergeLayer}
      />

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
    </>
  );
}
