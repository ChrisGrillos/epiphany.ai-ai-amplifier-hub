import React from 'react';
import WelcomeScreen from '@/components/welcome/WelcomeScreen';
import EmptyState from '@/components/chat/EmptyState';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import SessionHeader from '@/components/chat/SessionHeader';
import AttachReferencesSelector from '@/components/references/AttachReferencesSelector';
import DragScrollArea from '@/components/ui/DragScrollArea';
import MoltbookHub from '@/components/moltbook/MoltbookHub';
import WorkflowsPanel from '@/components/workflow/WorkflowsPanel';
import BridgeConversations from '@/components/bridge/BridgeConversations';
import ContextIndicator from '@/components/chat/ContextIndicator';

export default function HomeMainContent({
  activeVault,
  activeMainTab,
  setActiveMainTab,
  setShowMultiAgent,
  setShowSocialPlugin,
  setShowMergeLayer,
  setShowMultiApiSetup,
  setShowCreateVault,
  setShowSummary,
  handleEndSession,
  apiKey,
  messages,
  handleStartPrompt,
  activeSession,
  handleUpdateInsights,
  setShowReferencesList,
  setShowImportChat,
  handleExportContextPack,
  setShowGuardian,
  epiLevel,
  setShowEpiChat,
  setShowCalendarExport,
  setShowEmailDraft,
  setShowArchival,
  setShowMembers,
  references,
  handleCopyLivingSummary,
  handleCopySessionThread,
  handleCopyContextPack,
  lastContextPack,
  selectedReferenceIds,
  isLoading,
  streamingContent,
  messagesEndRef,
  toggleReferenceSelection,
  sessionAutoSaved,
  activeTab,
  isSynthesizing,
  handleSendMessage,
  setActiveTab,
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
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
              Bridge (Experimental)
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
              <span>??</span> Agents (Experimental)
            </button>
            <button
              onClick={() => setShowSocialPlugin(true)}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>??</span> Social (Demo)
            </button>
            <button
              onClick={() => setShowMergeLayer(true)}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>??</span> Merge (Experimental)
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

          <ContextIndicator
            vault={activeVault}
            references={references}
            selectedIds={selectedReferenceIds}
            messages={messages}
          />

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
                  ? (!apiKey ? 'Configure your API key to start...' : 'Message Grok…')
                  : 'Talk to Epi… (paste a web chat, request a context pack, or ask for a vault summary)'
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
