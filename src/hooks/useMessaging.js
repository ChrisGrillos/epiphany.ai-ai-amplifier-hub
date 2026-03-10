import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  detectWebChatPaste,
  parseWebChat,
  condenseWebChatLocal,
  prepareContextPackFromVault,
  generateVaultSnapshot,
} from '@/components/epi/epiPasteUtils';
import { needsLLMAssist } from '@/components/epi/tokenUtils';
import {
  analyzeWorkflowDelegation,
  generateOrchestrationMessage,
  shouldAutoExecuteWorkflow,
} from '@/components/epi/workflowOrchestration';
import { analyzeVaultHealth, getVaultHealthScore, formatHealthReport } from '@/components/epi/vaultHealth';
import { logEpiAction, prepareContextPack } from '@/components/epi/epiUtils';

export default function useMessaging({
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
  onRunSynthesis,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeTab, setActiveTab] = useState('api');
  const [lastContextPack, setLastContextPack] = useState(null);

  const handleEpiMessage = async (userMessage) => {
    try {
      const content = userMessage.content;
      let responseContent = '';
      let usedLLM = false;

      const delegations = analyzeWorkflowDelegation(userMessage, activeVault, references);
      if (delegations.length > 0 && !content.toLowerCase().includes('vault health')) {
        const primaryDelegation = delegations[0];

        if (primaryDelegation.agent === 'api' && !shouldAutoExecuteWorkflow(primaryDelegation, epiLevel)) {
          responseContent = generateOrchestrationMessage(delegations);
          responseContent += `\n\nSwitch to the **API** tab to execute this task with full context.`;

          await logEpiAction(
            activeVault.id,
            'workflow_suggestion',
            epiLevel,
            { task_type: primaryDelegation.task_type, suggested_agent: 'api' },
            'Suggested API delegation'
          );

          const assistantMessage = {
            role: 'assistant',
            content: responseContent,
            timestamp: new Date().toISOString(),
            target: 'epi',
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
          return;
        }
      }

      if (
        content.toLowerCase().includes('vault health') ||
        content.toLowerCase().includes('check vault') ||
        content.toLowerCase().includes('cleanup')
      ) {
        toast.info('Analyzing vault health...');
        const sessions = db ? await db.Session.filter({ vault_id: activeVault.id }) : [];
        const recommendations = await analyzeVaultHealth(activeVault, sessions, references);
        const healthScore = getVaultHealthScore(recommendations);
        responseContent = formatHealthReport(activeVault, recommendations, healthScore);

        await logEpiAction(
          activeVault.id,
          'vault_health_check',
          epiLevel,
          { score: healthScore, recommendations: recommendations.length },
          'Health check complete'
        );
      }
      else if (detectWebChatPaste(content)) {
        const parsedMessages = parseWebChat(content);

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
          responseContent = condenseWebChatLocal(parsedMessages);
        }

        await logEpiAction(
          activeVault.id,
          'condense_paste',
          epiLevel,
          { chars_in: content.length, chars_out: responseContent.length, used_llm: usedLLM },
          'Parse complete'
        );
      } else if (
        content.toLowerCase().includes('context pack') ||
        content.toLowerCase().includes('prep') ||
        content.toLowerCase().includes('prepare')
      ) {
        responseContent = prepareContextPackFromVault(activeVault, references, messages);
        setLastContextPack(responseContent);

        await logEpiAction(
          activeVault.id,
          'prepare_context_pack',
          epiLevel,
          { reference_count: references.length },
          'Context pack prepared'
        );
      } else if (
        content.toLowerCase().includes('summarize') ||
        content.toLowerCase().includes('snapshot') ||
        content.toLowerCase().includes('catch me up')
      ) {
        const sessions = db ? await db.Session.filter({ vault_id: activeVault.id }, '-created_date', 1) : [];
        responseContent = generateVaultSnapshot(activeVault, sessions);

        await logEpiAction(activeVault.id, 'vault_snapshot', epiLevel, {}, 'Snapshot generated');
      } else {
        const context = `Current Vault: ${activeVault?.name}\n\nLiving Summary:\n${activeVault?.living_summary || '(empty)'}`;

        responseContent = await base44.integrations.Core.InvokeLLM({
          prompt: `You are Epi, the concierge intelligence for Epiphany.AI. You help coordinate context between AI systems.\n\n${context}\n\nUser: ${content}`,
        });

        responseContent =
          responseContent.text || responseContent.output || responseContent.response || String(responseContent);

        await logEpiAction(
          activeVault.id,
          'user_query',
          epiLevel,
          { query: content, used_llm: true },
          responseContent
        );
      }

      const assistantMessage = {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
        target: 'epi',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Epi response failed');
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleApiMessage = async (userMessage) => {
    try {
      if (epiLevel >= 3) {
        const delegations = analyzeWorkflowDelegation(userMessage, activeVault, references);
        if (delegations.length > 0 && delegations[0].agent === 'epi') {
          toast.info('Epi suggests handling this internally - switch to Epi tab', { duration: 4000 });
        }
      }

      let contextText = `Context from Living Summary:\n${activeVault?.living_summary || 'No summary yet.'}`;

      if (selectedReferenceIds.length > 0) {
        const selectedRefs = references.filter((r) => selectedReferenceIds.includes(r.id));
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

      const conversationHistory = messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      const fullPrompt = conversationHistory
        ? `${conversationHistory}\n\nUser: ${userMessage.content}`
        : userMessage.content;

      const { callLLMProvider, getActiveProvider } = await import('@/components/epi/workflowEngine');
      const activeProvider = (await getActiveProvider().catch(() => 'base44')) || 'base44';
      let response = await callLLMProvider(activeProvider, `${systemPrompt}\n\n${fullPrompt}`);

      if (typeof response !== 'string') {
        response = response.text || response.output || response.response || String(response);
      }

      if (response.includes('PROPOSE_FILE_UPDATE:')) {
        const match = response.match(/PROPOSE_FILE_UPDATE:\s*(.+)\n([\s\S]+)/);
        if (match) {
          const filename = match[1].trim();
          const proposedContent = match[2].trim();
          const reference = references.find((r) => r.filename === filename);

          if (reference) {
            setPendingReferenceDiff({ reference, proposedContent });
            setShowReferenceDiff(true);
          }
        }
      }

      const assistantMessage = {
        role: 'assistant',
        content:
          response.replace(/PROPOSE_FILE_UPDATE:[\s\S]+/, '').trim() ||
          "I've proposed changes to the reference file.",
        timestamp: new Date().toISOString(),
        target: 'api',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response');
      console.error(error);
    }

    setIsLoading(false);
  };

  const handleSendMessage = async ({ content, image_urls, target = 'api' }) => {
    const userMessage = {
      role: 'user',
      content,
      image_urls,
      timestamp: new Date().toISOString(),
      target,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    if (sessionManagerRef.current) {
      sessionManagerRef.current.reset();
    }

    if (target === 'epi') {
      await handleEpiMessage(userMessage);
    } else {
      await handleApiMessage(userMessage);
    }
  };

  const handleStartPrompt = (suggestion) => {
    handleSendMessage({ content: suggestion, image_urls: [] });
  };

  const handleImportWebChat = async ({
    messages: importedMessages,
    source,
    import_source_name,
    appendToCurrent,
    runSynthesis,
  }) => {
    try {
      if (appendToCurrent && activeSession) {
        setMessages((prev) => [...prev, ...importedMessages]);
        toast.success('Chat imported and appended');
      } else {
        const session = await base44.entities.Session.create({
          vault_id: activeVault.id,
          title: `Imported from ${import_source_name}`,
          messages: importedMessages,
          source,
          import_source_name,
          status: 'completed',
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
        });

        setMessages(importedMessages);
        setActiveSession(session);
        toast.success('Chat imported');
      }

      await logEpiAction(
        activeVault.id,
        'import_chat',
        epiLevel,
        { source: import_source_name, message_count: importedMessages.length },
        'External chat imported'
      );

      if (runSynthesis) {
        setTimeout(() => onRunSynthesis?.(), 500);
      }
    } catch (error) {
      toast.error('Failed to import chat');
    }
  };

  const handleCopyLivingSummary = () => {
    navigator.clipboard.writeText(activeVault?.living_summary || '');
    toast.success('Living Summary copied');
  };

  const handleCopySessionThread = () => {
    const thread = messages
      .map((m) => `${m.role === 'user' ? 'User' : m.target === 'epi' ? 'Epi' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
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

    logEpiAction(
      activeVault.id,
      'context_prep',
      epiLevel,
      { reference_count: references.length, message_count: messages.length },
      'Context pack prepared for external AI'
    );
  };

  return {
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
  };
}
