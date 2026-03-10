import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  SessionManager,
  shouldAutoCloseSession,
  generateSessionSummary,
  suggestNextActions,
  generateSessionTitle,
} from '@/components/session/sessionManager';
import { logEpiAction } from '@/components/epi/epiUtils';

export default function useSessionManager({
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
}) {
  const sessionManagerRef = useRef(null);

  useEffect(() => {
    if (activeVault && activeSession && messages.length > 0) {
      if (!sessionManagerRef.current) {
        sessionManagerRef.current = new SessionManager(
          activeVault,
          async () => {
            if (messages.length > 0) {
              try {
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
          async () => {
            if (shouldAutoCloseSession(activeSession, messages)) {
              const summary = generateSessionSummary(
                messages,
                references.filter((r) => selectedReferenceIds.includes(r.id))
              );
              const nextActions = suggestNextActions(summary, activeVault);

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

              await logEpiAction(
                activeVault.id,
                'session_end',
                epiLevel,
                { auto_closed: true, message_count: messages.length },
                summary
              );

              toast.info('Session auto-closed due to inactivity', {
                description:
                  nextActions.length > 0 ? nextActions[0].description : 'Session saved to history',
              });

              setMessages([]);
              setActiveSession(null);
              setSelectedReferenceIds([]);

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

    return () => {
      if (sessionManagerRef.current) {
        sessionManagerRef.current.stop();
        sessionManagerRef.current = null;
      }
    };
  }, [activeVault, activeSession, messages.length]);

  return { sessionManagerRef };
}
