import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function useGuardian({ activeVault, messages }) {
  const [guardianNotes, setGuardianNotes] = useState([]);
  const [guardianLoading, setGuardianLoading] = useState(false);
  const [showGuardian, setShowGuardian] = useState(false);

  const runGuardianCheck = async (summaryToCheck = null) => {
    setGuardianLoading(true);
    setShowGuardian(true);

    try {
      const summary = summaryToCheck || activeVault?.living_summary;
      const transcript = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

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
                  target_section: { type: 'string' },
                },
              },
            },
          },
        },
      });

      setGuardianNotes(result.notes || []);
    } catch (error) {
      toast.error('Guardian check failed');
      console.error(error);
    }

    setGuardianLoading(false);
  };

  return {
    guardianNotes,
    setGuardianNotes,
    guardianLoading,
    showGuardian,
    setShowGuardian,
    runGuardianCheck,
  };
}
