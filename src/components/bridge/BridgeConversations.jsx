import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Users, Shield, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CreateBridgeModal from './CreateBridgeModal';
import BridgeChat from './BridgeChat';

export default function BridgeConversations({ vault }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['bridge_conversations', vault?.id],
    queryFn: () => base44.entities.BridgeConversation.filter({ vault_id: vault.id, status: 'active' }),
    enabled: !!vault
  });

  const contextLevelColors = {
    minimal: 'bg-green-500/20 text-green-400 border-green-500/30',
    summary_only: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    full_context: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  };

  if (selectedConversation) {
    return (
      <BridgeChat
        conversation={selectedConversation}
        vault={vault}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      <div className="h-14 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Bridge Conversations</h2>
          <Badge variant="outline" className="border-violet-500/30 text-violet-400">
            {conversations.length} active
          </Badge>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-500">
          <Plus className="h-4 w-4 mr-2" />
          New Bridge
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Shield className="h-16 w-16 text-zinc-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Bridge Conversations</h3>
            <p className="text-sm text-zinc-400 mb-4 max-w-md">
              Create secure bridge conversations where you, Epi, and external LLMs can collaborate without direct vault access.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Bridge
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conversations.map((conv) => (
              <Card key={conv.id} className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center justify-between">
                    <span>{conv.title}</span>
                    <Badge className={contextLevelColors[conv.context_level]}>
                      {conv.context_level.replace('_', ' ')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-zinc-500" />
                    <span className="text-xs text-zinc-400">
                      {conv.participants?.length || 0} participants
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {conv.participants?.map((p, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                        {p.name}
                      </Badge>
                    ))}
                  </div>

                  {conv.bridge_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(conv.bridge_url);
                        toast.success('Bridge URL copied');
                      }}
                      className="w-full text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Copy Bridge URL
                    </Button>
                  )}

                  <Button
                    onClick={() => setSelectedConversation(conv)}
                    className="w-full bg-violet-600 hover:bg-violet-500"
                    size="sm"
                  >
                    <MessageSquare className="h-3 w-3 mr-2" />
                    Open Conversation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <CreateBridgeModal
        open={showCreate}
        onOpenChange={setShowCreate}
        vaultId={vault?.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['bridge_conversations'] });
          setShowCreate(false);
        }}
      />
    </div>
  );
}