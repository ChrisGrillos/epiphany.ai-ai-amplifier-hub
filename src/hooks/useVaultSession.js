import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function useVaultSession({ currentUser, db }) {
  const queryClient = useQueryClient();

  const [activeVault, setActiveVault] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedReferenceIds, setSelectedReferenceIds] = useState([]);
  const [sessionAutoSaved, setSessionAutoSaved] = useState(false);

  const { data: vaults = [], isLoading: vaultsLoading } = useQuery({
    queryKey: ['vaults', currentUser?.email],
    queryFn: () => (db ? db.Vault.list('-last_accessed') : []),
    enabled: !!db,
  });

  const { data: references = [], refetch: refetchReferences } = useQuery({
    queryKey: ['references', activeVault?.id, currentUser?.email],
    queryFn: () => (db && activeVault ? db.Reference.filter({ vault_id: activeVault.id }) : []),
    enabled: !!db && !!activeVault,
  });

  const updateVaultMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vault.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaults', currentUser?.email] });
    },
  });

  const startNewSession = (vault) => {
    setMessages([]);
    setActiveSession({
      vault_id: vault.id,
      started_at: new Date().toISOString(),
      messages: [],
    });

    updateVaultMutation.mutate({
      id: vault.id,
      data: { last_accessed: new Date().toISOString() },
    });
  };

  const createVaultMutation = useMutation({
    mutationFn: (data) => base44.entities.Vault.create(data),
    onSuccess: (newVault) => {
      queryClient.invalidateQueries({ queryKey: ['vaults', currentUser?.email] });
      setActiveVault(newVault);
      startNewSession(newVault);
      toast.success('Vault created');
    },
  });

  const handleSelectVault = (vault) => {
    setActiveVault(vault);
    startNewSession(vault);
  };

  const toggleReferenceSelection = (refId) => {
    setSelectedReferenceIds((prev) =>
      prev.includes(refId) ? prev.filter((id) => id !== refId) : [...prev, refId]
    );
  };

  const handleDeleteReference = async (refId) => {
    try {
      await base44.entities.Reference.delete(refId);
      queryClient.invalidateQueries({ queryKey: ['references'] });
      toast.success('Reference deleted');
    } catch (error) {
      toast.error('Failed to delete reference');
    }
  };

  return {
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
  };
}
