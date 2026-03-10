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
import AddReferenceModal from '@/components/references/AddReferenceModal';
import ReferencesList from '@/components/references/ReferencesList';
import AttachReferencesSelector from '@/components/references/AttachReferencesSelector';
import ReferenceDiffReview from '@/components/references/ReferenceDiffReview';
import ImportWebChatModal from '@/components/import/ImportWebChatModal';
import ExportMenu from '@/components/export/ExportMenu';
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
import { logEpiAction, shouldEpiSpeak, generateProactiveNudge, prepareContextPack } from '@/components/epi/epiUtils';
import { getActiveProvider } from '@/components/epi/workflowEngine';
import { userScopedEntities } from '@/components/lib/userScoped';
import { 
  detectWebChatPaste, 
  parseWebChat, 
  condenseWebChatLocal,
  prepareContextPackFromVault,
  generateVaultSnapshot 
} from '@/components/epi/epiPasteUtils';
import { estimateTokens, needsLLMAssist, truncateToTokenLimit } from '@/components/epi/tokenUtils';
import { 
  SessionManager, 
  shouldAutoCloseSession, 
  generateSessionSummary, 
  suggestNextActions,
  generateSessionTitle 
} from '@/components/session/sessionManager';
import { analyzeVaultHealth, getVaultHealthScore, formatHealthReport } from '@/components/epi/vaultHealth';
import { analyzeWorkflowDelegation, prepareAgentContext, generateOrchestrationMessage, shouldAutoExecuteWorkflow } from '@/components/epi/workflowOrchestration';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeTab, setActiveTab] = useState('api');
  const [lastContextPack, setLastContextPack] = useState(null);
  
  // Modals
  const [showCreateVault, setShowCreateVault] = useState(false);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showAddReference, setShowAddReference] = useState(false);
  const [showReferencesList, setShowReferencesList] = useState(false);
  const [showReferenceDiff, setShowReferenceDiff] = useState(false);
  const [showImportChat, setShowImportChat] = useState(false);
  const [showGuardian, setShowGuardian] = useState(false);
  const [showCalendarExport, setShowCalendarExport] = useState(false);
  const [showEmailDraft, setShowEmailDraft] = useState(false);
  const [showEpiSettings, setShowEpiSettings] = useState(false);
  const [showEpiChat, setShowEpiChat] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('chat');
  const [showArchival, setShowArchival] = useState(false);
  const [showMultiApiSetup, setShowMultiApiSetup] = useState(false);
  const [showMergeLayer, setShowMergeLayer] = useState(false);
  const [showMultiAgent, setShowMultiAgent] = useState(false);
  const [showSocialPlugin, setShowSocialPlugin] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  
  // Synthesis
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // References
  const [pendingReferenceDiff, setPendingReferenceDiff] = useState(null);
  
  // Guardian
  const [guardianNotes, setGuardianNotes] = useState([]);
  const [guardianLoading, setGuardianLoading] = useState(false);
  
  // Session Manager
  const sessionManagerRef = useRef(null);
  
  // Tutorial
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuickTips, setShowQuickTips] = useState(false);
  const [tutorialProgress, setTutorialProgress] = useState(null);

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
    setEpiLevel,
    epiNudge,
    setEpiNudge,
    appSettings,
    handleUpdateEpiLevel,
  } = useEpi({ activeVault, db });

  // Load tutorial progress
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const scopedDb = userScopedEntities(user);
        
        // Load tutorial progress
        const progress = await scopedDb.TutorialProgress.list();
        if (progress.length > 0) {
          setTutorialProgress(progress[0]);
          if (progress[0].tutorial_active && !progress[0].dismissed) {
            setShowTutorial(true);
          }
        } else {
          const newProgress = await scopedDb.TutorialProgress.create({
            tutorial_active: true,
            completed_steps: [],
            current_step: 'welcome'
          });
          setTutorialProgress(newProgress);
          setShowTutorial(true);
        }
      } catch (error) {
        console.error('Failed to load tutorial progress:', error);
      }
    };
    loadSettings();
  }, []);
  
  // Show quick tips after tutorial completion
  useEffect(() => {
    if (tutorialProgress && !tutorialProgress.tutorial_active && !tutorialProgress.dismissed) {
      const timer = setTimeout(() => setShowQuickTips(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [tutorialProgress]);

  // Session Management - Auto-save and Auto-close
  useEffect(() => {
    if (activeVault && activeSession && messages.length > 0) {
      // Start session manager
      if (!sessionManagerRef.current) {
        sessionManagerRef.current = new SessionManager(
          activeVault,
          // Auto-save handler
          async () => {
            if (messages.length > 0) {
              try {
                // Update session in background
                const title = generateSessionTitle(messages);
                await base44.entities.Session.create({
                  vault_id: activeVault.id,
                  title: `${title} (auto-saved)`,
                  messages,
                  status: 'active',
                  started_at: activeSession.started_at,
                  attached_reference_ids: selectedReferenceIds,
                });
                setSessionAutoSaved(true);
                setTimeout(() => setSessionAutoSaved(false), 2000);
              } catch (error) {
                console.error('Auto-save failed:', error);
              }
            }
          },
          // Auto-close handler
          async () => {
            if (shouldAutoCloseSession(activeSession, messages)) {
              // Generate summary
              const summary = generateSessionSummary(messages, references.filter(r => selectedReferenceIds.includes(r.id)));
              const nextActions = suggestNextActions(summary, activeVault);
              
              // Save session
              const title = generateSessionTitle(messages);
              await base44.entities.Session.create({
                vault_id: activeVault.id,
                title: `${title} (auto-closed)`,
                messages,
                status: 'completed',
                started_at: activeSession.started_at,
                ended_at: new Date().toISOString(),
                attached_reference_ids: selectedReferenceIds,
              });
              
              // Log Epi action
              await logEpiAction(activeVault.id, 'session_end', epiLevel,
                { auto_closed: true, message_count: messages.length },
                summary
              );
              
              // Show notification with suggestions
              toast.info('Session auto-closed due to inactivity', {
                description: nextActions.length > 0 ? nextActions[0].description : 'Session saved to history'
              });
              
              // Reset session
              setMessages([]);
              setActiveSession(null);
              setSelectedReferenceIds([]);
              
              // Stop session manager
              if (sessionManagerRef.current) {
                sessionManagerRef.current.stop();
                sessionManagerRef.current = null;
              }
            }
          }
        );
        sessionManagerRef.current.start();
      }
    }
    
    // Cleanup on unmount or vault change
    return () => {
      if (sessionManagerRef.current) {
        sessionManagerRef.current.stop();
        sessionManagerRef.current = null;
      }
    };
  }, [activeVault, activeSession, messages.length]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSaveApiKey = async () => {
    // Keys are now saved via workflowEngine.saveProviderKey -> llmProxy backend
    toast.success('API key saved securely');
  };

  const handleSendMessage = async ({ content, image_urls, target = 'api' }) => {
    const userMessage = {
      role: 'user',
      content,
      image_urls,
      timestamp: new Date().toISOString(),
      target
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    // Reset session manager timer on new message
    if (sessionManagerRef.current) {
      sessionManagerRef.current.reset();
    }

    // Route to appropriate handler
    if (target === 'epi') {
      await handleEpiMessage(userMessage);
    } else {
      await handleApiMessage(userMessage);
    }
  };

  const handleEpiMessage = async (userMessage) => {
    try {
      const content = userMessage.content;
      let responseContent = '';
      let usedLLM = false;

      // Analyze for workflow delegation
      const delegations = analyzeWorkflowDelegation(userMessage, activeVault, references);
      if (delegations.length > 0 && !content.toLowerCase().includes('vault health')) {
        const primaryDelegation = delegations[0];
        
        // If it should be routed to API, suggest switching
        if (primaryDelegation.agent === 'api' && !shouldAutoExecuteWorkflow(primaryDelegation, epiLevel)) {
          responseContent = generateOrchestrationMessage(delegations);
          responseContent += `\n\nSwitch to the **API** tab to execute this task with full context.`;
          
          await logEpiAction(activeVault.id, 'workflow_suggestion', epiLevel,
            { task_type: primaryDelegation.task_type, suggested_agent: 'api' },
            'Suggested API delegation'
          );
          
          const assistantMessage = {
            role: 'assistant',
            content: responseContent,
            timestamp: new Date().toISOString(),
            target: 'epi'
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
          return;
        }
      }

      // Check for vault health request
      if (content.toLowerCase().includes('vault health') || 
          content.toLowerCase().includes('check vault') ||
          content.toLowerCase().includes('cleanup')) {
        toast.info('Analyzing vault health...');
        const sessions = db ? await db.Session.filter({ vault_id: activeVault.id }) : [];
        const recommendations = await analyzeVaultHealth(activeVault, sessions, references);
        const healthScore = getVaultHealthScore(recommendations);
        responseContent = formatHealthReport(activeVault, recommendations, healthScore);
        
        await logEpiAction(activeVault.id, 'vault_health_check', epiLevel,
          { score: healthScore, recommendations: recommendations.length },
          'Health check complete'
        );
      }
      // Check if it's a web chat paste
      if (detectWebChatPaste(content)) {
        const parsedMessages = parseWebChat(content);
        
        // Check if LLM assist is needed
        if (needsLLMAssist(content) && apiKey) {
          toast.info('Using AI to condense this (counts toward usage)');
          
          const prompt = `Condense this pasted conversation into structured notes.

Conversation:
${content}

Output format:
Decisions:
- ...

Actions/Next Steps:
- ...

Questions:
- ...

Key Points:
- ...`;

          responseContent = await base44.integrations.Core.InvokeLLM({ prompt });
          responseContent = responseContent.text || responseContent.output || String(responseContent);
          usedLLM = true;
        } else {
          // Use local processing
          responseContent = condenseWebChatLocal(parsedMessages);
        }
        
        // Log action
        await logEpiAction(activeVault.id, 'condense_paste', epiLevel, 
          { chars_in: content.length, chars_out: responseContent.length, used_llm: usedLLM },
          'Parse complete'
        );
      }
      // Check for context pack request
      else if (content.toLowerCase().includes('context pack') || 
               content.toLowerCase().includes('prep') ||
               content.toLowerCase().includes('prepare')) {
        responseContent = prepareContextPackFromVault(activeVault, references, messages);
        setLastContextPack(responseContent);
        
        await logEpiAction(activeVault.id, 'prepare_context_pack', epiLevel,
          { reference_count: references.length },
          'Context pack prepared'
        );
      }
      // Check for vault snapshot request
      else if (content.toLowerCase().includes('summarize') ||
               content.toLowerCase().includes('snapshot') ||
               content.toLowerCase().includes('catch me up')) {
        const sessions = db ? await db.Session.filter({ vault_id: activeVault.id }, '-created_date', 1) : [];
        responseContent = generateVaultSnapshot(activeVault, sessions);
        
        await logEpiAction(activeVault.id, 'vault_snapshot', epiLevel, {}, 'Snapshot generated');
      }
      // Default: Use LLM for general Epi queries
      else {
        const context = `Current Vault: ${activeVault?.name}\n\nLiving Summary:\n${activeVault?.living_summary || '(empty)'}`;
        
        responseContent = await base44.integrations.Core.InvokeLLM({
          prompt: `You are Epi, the concierge intelligence for Epiphany.AI. You help coordinate context between AI systems.\n\n${context}\n\nUser: ${content}`
        });
        
        // Normalize response
        responseContent = responseContent.text || responseContent.output || responseContent.response || String(responseContent);
        
        await logEpiAction(activeVault.id, 'user_query', epiLevel,
          { query: content, used_llm: true },
          responseContent
        );
      }

      const assistantMessage = {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
        target: 'epi'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Epi response failed');
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleApiMessage = async (userMessage) => {
    try {
      // Check if Epi should provide orchestration guidance
      if (epiLevel >= 3) {
        const delegations = analyzeWorkflowDelegation(userMessage, activeVault, references);
        if (delegations.length > 0 && delegations[0].agent === 'epi') {
          toast.info('Epi suggests handling this internally - switch to Epi tab', { duration: 4000 });
        }
      }
      // Build system prompt with Living Summary + Selected References
      let contextText = `Context from Living Summary:\n${activeVault?.living_summary || 'No summary yet.'}`;
      
      // Inject selected references (cap to safe token limit)
      if (selectedReferenceIds.length > 0) {
        const selectedRefs = references.filter(r => selectedReferenceIds.includes(r.id));
        const MAX_TOTAL_CHARS = 15000;
        let totalChars = 0;
        const refTexts = [];
        
        for (const ref of selectedRefs) {
          const refContent = ref.full_content || ref.excerpt || '';
          if (totalChars + refContent.length < MAX_TOTAL_CHARS) {
            refTexts.push(`\n\n--- Reference: ${ref.filename} ---\n${refContent}`);
            totalChars += refContent.length;
          } else if (ref.excerpt && totalChars + ref.excerpt.length < MAX_TOTAL_CHARS) {
            refTexts.push(`\n\n--- Reference: ${ref.filename} (excerpt) ---\n${ref.excerpt}`);
            totalChars += ref.excerpt.length;
          }
        }
        
        if (refTexts.length > 0) {
          contextText += '\n\nAttached References:' + refTexts.join('');
        }
      }

      const systemPrompt = `You are Epiphany, an AI thinking amplifier. You help users explore ideas, make decisions, and organize their thoughts.

${contextText}

Be concise, insightful, and helpful. Focus on durable insights that could be added to the Living Summary later.

IMPORTANT: If the user asks you to modify a reference file, respond with:
PROPOSE_FILE_UPDATE: <filename>
<proposed new content>`;

      // Build conversation history
      const conversationHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');

      const fullPrompt = conversationHistory 
        ? `${conversationHistory}\n\nUser: ${userMessage.content}`
        : userMessage.content;

      // All LLM calls route through the secure backend proxy
      const { callLLMProvider } = await import('@/components/epi/workflowEngine');
      let response = await callLLMProvider('base44', `${systemPrompt}\n\n${fullPrompt}`);

      // Normalize response to string
      if (typeof response !== 'string') {
        response = response.text || response.output || response.response || String(response);
      }

      // Check if AI proposes a file update
      if (response.includes('PROPOSE_FILE_UPDATE:')) {
        const match = response.match(/PROPOSE_FILE_UPDATE:\s*(.+)\n([\s\S]+)/);
        if (match) {
          const filename = match[1].trim();
          const proposedContent = match[2].trim();
          const reference = references.find(r => r.filename === filename);
          
          if (reference) {
            setPendingReferenceDiff({ reference, proposedContent });
            setShowReferenceDiff(true);
          }
        }
      }

      const assistantMessage = {
        role: 'assistant',
        content: response.replace(/PROPOSE_FILE_UPDATE:[\s\S]+/, '').trim() || 'I\'ve proposed changes to the reference file.',
        timestamp: new Date().toISOString(),
        target: 'api'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response');
      console.error(error);
    }

    setIsLoading(false);
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

  const handleStartPrompt = (suggestion) => {
    // This would populate the input - for now just triggers a message
    handleSendMessage({ content: suggestion, image_urls: [] });
  };

  const handleAcceptReferenceDiff = async (newContent) => {
    if (!pendingReferenceDiff) return;
    
    try {
      // Update the reference content
      await updateVaultMutation.mutateAsync({
        id: pendingReferenceDiff.reference.id,
        data: { 
          full_content: newContent,
          excerpt: newContent.substring(0, 500)
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ['references'] });
      setShowReferenceDiff(false);
      setPendingReferenceDiff(null);
      toast.success('Reference updated');
    } catch (error) {
      toast.error('Failed to update reference');
    }
  };

  const handleImportWebChat = async ({ messages: importedMessages, source, import_source_name, appendToCurrent, runSynthesis }) => {
    try {
      if (appendToCurrent && activeSession) {
        // Append to current session
        setMessages(prev => [...prev, ...importedMessages]);
        toast.success('Chat imported and appended');
      } else {
        // Create new session
        const session = await base44.entities.Session.create({
          vault_id: activeVault.id,
          title: `Imported from ${import_source_name}`,
          messages: importedMessages,
          source,
          import_source_name,
          status: 'completed',
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString()
        });
        
        setMessages(importedMessages);
        setActiveSession(session);
        toast.success('Chat imported');
      }

      // Log Epi action
      await logEpiAction(activeVault.id, 'import_chat', epiLevel, 
        { source: import_source_name, message_count: importedMessages.length },
        'External chat imported'
      );

      // Run synthesis if requested
      if (runSynthesis) {
        setTimeout(() => handleEndSession(), 500);
      }
    } catch (error) {
      toast.error('Failed to import chat');
    }
  };

  const runGuardianCheck = async (summaryToCheck = null) => {
    setGuardianLoading(true);
    setShowGuardian(true);

    try {
      const summary = summaryToCheck || activeVault?.living_summary;
      const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');

      const prompt = `You are the Vault Guardian. Analyze this Living Summary and recent session for issues.

Living Summary:
${summary}

Recent Session:
${transcript || '(no recent session)'}

Check for:
1. Contradictions within the Living Summary
2. Conflicts between summary and transcript
3. Stale or conflicting Next Actions
4. Unresolved Open Questions

Return ONLY valid JSON in this exact format:
{
  "status": "ok",
  "notes": [
    {
      "type": "contradiction|stale_action|missing_link|uncertainty|risk",
      "severity": "low|medium|high",
      "title": "Short headline",
      "detail": "1-2 sentences explaining the issue",
      "suggested_change": "What to edit",
      "target_section": "Objective|Key Facts|Decisions|Open Questions|Next Actions"
    }
  ]
}

If no issues, return: {"status": "ok", "notes": []}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            notes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  title: { type: 'string' },
                  detail: { type: 'string' },
                  suggested_change: { type: 'string' },
                  target_section: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setGuardianNotes(result.notes || []);
    } catch (error) {
      toast.error('Guardian check failed');
      console.error(error);
    }

    setGuardianLoading(false);
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
  });

  const handleCopyLivingSummary = () => {
    navigator.clipboard.writeText(activeVault?.living_summary || '');
    toast.success('Living Summary copied');
  };

  const handleCopySessionThread = () => {
    const thread = messages.map(m => 
      `${m.role === 'user' ? 'User' : m.target === 'epi' ? 'Epi' : 'Assistant'}: ${m.content}`
    ).join('\n\n');
    navigator.clipboard.writeText(thread);
    toast.success('Session thread copied');
  };

  const handleCopyContextPack = () => {
    if (lastContextPack) {
      navigator.clipboard.writeText(lastContextPack);
      toast.success('Context pack copied');
    } else {
      const pack = prepareContextPackFromVault(activeVault, references, messages);
      setLastContextPack(pack);
      navigator.clipboard.writeText(pack);
      toast.success('Context pack generated and copied');
    }
  };

  const handleExportContextPack = () => {
    const pack = prepareContextPack(activeVault, references, messages, '');
    navigator.clipboard.writeText(pack);
    toast.success('Context pack copied (prepared by Epi)');
    
    // Log action
    logEpiAction(activeVault.id, 'context_prep', epiLevel, 
      { reference_count: references.length, message_count: messages.length },
      'Context pack prepared for external AI'
    );
  };

  const handleUpdateTutorialProgress = async (stepId) => {
    if (!tutorialProgress) return;
    try {
      const updated = await base44.entities.TutorialProgress.update(tutorialProgress.id, {
        current_step: stepId,
        completed_steps: [...new Set([...tutorialProgress.completed_steps, stepId])]
      });
      setTutorialProgress(updated);
    } catch (error) {
      console.error('Failed to update tutorial progress:', error);
    }
  };

  const handleCompleteTutorial = async () => {
    if (!tutorialProgress) return;
    try {
      await base44.entities.TutorialProgress.update(tutorialProgress.id, {
        tutorial_active: false,
        dismissed: true
      });
      setShowTutorial(false);
      toast.success('Tutorial completed! ??');
      setTimeout(() => setShowQuickTips(true), 1000);
    } catch (error) {
      console.error('Failed to complete tutorial:', error);
    }
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


