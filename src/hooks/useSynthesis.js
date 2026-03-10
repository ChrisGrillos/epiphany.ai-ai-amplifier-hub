import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { logEpiAction, generateProactiveNudge } from '@/components/epi/epiUtils';
import { analyzeVaultHealth } from '@/components/epi/vaultHealth';

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

export default function useSynthesis({
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
  onSessionFinalized,
}) {
  const [proposedSummary, setProposedSummary] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showSynthesisReview, setShowSynthesisReview] = useState(false);

  const handleEndSession = async () => {
    if (messages.length === 0) {
      toast.error('No messages to synthesize');
      return;
    }

    setIsSynthesizing(true);

    try {
      const transcript = messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
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
          last_accessed: new Date().toISOString(),
        },
      });

      await base44.entities.Session.create({
        vault_id: activeVault.id,
        title: `Session ${new Date().toLocaleDateString()}`,
        messages,
        status: 'completed',
        started_at: activeSession?.started_at,
        ended_at: new Date().toISOString(),
        attached_reference_ids: selectedReferenceIds,
        synthesis_result: {
          proposed_summary: finalSummary,
          accepted: true,
        },
      });

      await onSessionFinalized?.();

      setActiveVault((prev) => ({ ...prev, living_summary: finalSummary }));
      setShowSynthesisReview(false);
      setMessages([]);
      setSelectedReferenceIds([]);
      toast.success('Living Summary updated');

      await logEpiAction(
        activeVault.id,
        'synthesis_complete',
        epiLevel,
        { message_count: messages.length },
        'Synthesis accepted and saved'
      );

      if (activeVault.run_guardian_after_synthesis && epiLevel >= 3) {
        runGuardianCheck?.(finalSummary);
      }

      if (epiLevel === 4) {
        setTimeout(async () => {
          const nudge = generateProactiveNudge(activeVault, [], references);
          if (nudge) {
            setEpiNudge?.(nudge);
          } else {
            const sessions = await base44.entities.Session.filter({ vault_id: activeVault.id });
            const recommendations = await analyzeVaultHealth(activeVault, sessions, references);
            if (
              recommendations.length > 0 &&
              recommendations.some((r) => r.severity === 'high' || r.severity === 'medium')
            ) {
              setEpiNudge?.({
                type: 'vault_health',
                message: `Vault health check: ${recommendations[0].title}`,
                severity: recommendations[0].severity,
              });
            }
          }
        }, 2000);
      }
    } catch (error) {
      toast.error('Failed to save summary');
    }
  };

  const handleRejectSynthesis = () => {
    setShowSynthesisReview(false);
    toast.info('Synthesis rejected - session continues');
  };

  return {
    proposedSummary,
    isSynthesizing,
    showSynthesisReview,
    setShowSynthesisReview,
    handleEndSession,
    handleAcceptSynthesis,
    handleRejectSynthesis,
  };
}
