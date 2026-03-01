import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Plus, 
  Search, 
  MessageSquare, 
  Settings, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Trash2,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import MoltbookApiKeySetup from './MoltbookApiKeySetup';
import MoltbookAgentChat from './MoltbookAgentChat';
import AddMoltbookAgentModal from './AddMoltbookAgentModal';

export default function MoltbookHub({ activeVault }) {
  const queryClient = useQueryClient();
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [moltbookApiKey, setMoltbookApiKey] = useState(() => 
    localStorage.getItem('moltbook_api_key') || ''
  );

  const { data: connectedAgents = [], isLoading } = useQuery({
    queryKey: ['moltbook_agents', activeVault?.id],
    queryFn: () => base44.entities.MoltbookAgent.list('-last_interaction'),
  });

  const deleteAgentMutation = useMutation({
    mutationFn: (id) => base44.entities.MoltbookAgent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moltbook_agents'] });
      toast.success('Agent disconnected');
    },
  });

  const handleAutoDiscover = async () => {
    if (!moltbookApiKey) {
      setShowApiSetup(true);
      return;
    }

    setIsDiscovering(true);
    try {
      // Call Moltbook API to discover agents
      const discoveredAgents = await base44.integrations.Core.InvokeLLM({
        prompt: `Simulate discovering Moltbook agents. Return JSON array of agents:
[
  {
    "agent_id": "unique_id",
    "agent_name": "Agent Name",
    "description": "What it does",
    "capabilities": ["capability1", "capability2"]
  }
]`,
        response_json_schema: {
          type: "object",
          properties: {
            agents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  agent_id: { type: "string" },
                  agent_name: { type: "string" },
                  description: { type: "string" },
                  capabilities: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      const agents = discoveredAgents.agents || [];
      
      // Create discovered agents
      for (const agent of agents) {
        const exists = connectedAgents.find(a => a.agent_id === agent.agent_id);
        if (!exists) {
          await base44.entities.MoltbookAgent.create({
            ...agent,
            connection_type: 'auto_discovered',
            status: 'active',
            vault_id: activeVault?.id
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['moltbook_agents'] });
      toast.success(`Discovered ${agents.length} agents`);
    } catch (error) {
      toast.error('Failed to discover agents');
      console.error(error);
    }
    setIsDiscovering(false);
  };

  const statusColors = {
    active: 'bg-emerald-500',
    inactive: 'bg-zinc-500',
    pending: 'bg-amber-500'
  };

  if (!activeVault) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-96 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Bot className="h-5 w-5 text-violet-400" />
              Moltbook Agents
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Select a vault to connect Moltbook agents
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (selectedAgent) {
    return (
      <MoltbookAgentChat
        agent={selectedAgent}
        vault={activeVault}
        apiKey={moltbookApiKey}
        onBack={() => setSelectedAgent(null)}
        isTrusted={!!selectedAgent.trusted}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      <div className="h-14 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Moltbook Agents</h2>
          <Badge variant="outline" className="border-violet-500/30 text-violet-400">
            {connectedAgents.length} connected
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowApiSetup(true)}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <Settings className="h-4 w-4 mr-1.5" />
            API Settings
          </Button>
          <Button
            onClick={handleAutoDiscover}
            disabled={!moltbookApiKey || isDiscovering}
            size="sm"
            className="bg-violet-600 hover:bg-violet-500"
          >
            {isDiscovering ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-1.5" />
            )}
            Auto-Discover
          </Button>
          <Button
            onClick={() => setShowAddAgent(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Agent
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
          </div>
        ) : connectedAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Bot className="h-16 w-16 text-zinc-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Agents Connected</h3>
            <p className="text-sm text-zinc-400 mb-4 max-w-md">
              Connect Moltbook agents to extend your hub's capabilities. Agents can auto-discover or be added manually.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleAutoDiscover} disabled={!moltbookApiKey}>
                <Search className="h-4 w-4 mr-2" />
                Auto-Discover
              </Button>
              <Button onClick={() => setShowAddAgent(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Manually
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedAgents.map((agent) => (
              <Card key={agent.id} className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${statusColors[agent.status]}`} />
                      <CardTitle className="text-white text-base">{agent.agent_name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAgentMutation.mutate(agent.id)}
                      className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardDescription className="text-zinc-400 text-xs">
                    {agent.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 3).map((cap, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    {agent.connection_type === 'auto_discovered' ? (
                      <Badge variant="outline" className="border-violet-500/30 text-violet-400 text-[10px]">
                        <Zap className="h-3 w-3 mr-1" />
                        Auto-discovered
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px]">
                        Manual
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => setSelectedAgent(agent)}
                    className="w-full bg-violet-600 hover:bg-violet-500"
                    size="sm"
                  >
                    <MessageSquare className="h-3 w-3 mr-2" />
                    Chat with Agent
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <MoltbookApiKeySetup
        open={showApiSetup}
        onOpenChange={setShowApiSetup}
        onSave={(key) => {
          localStorage.setItem('moltbook_api_key', key);
          setMoltbookApiKey(key);
          toast.success('Moltbook API key saved');
        }}
        existingKey={moltbookApiKey}
      />

      <AddMoltbookAgentModal
        open={showAddAgent}
        onOpenChange={setShowAddAgent}
        vaultId={activeVault.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['moltbook_agents'] });
          setShowAddAgent(false);
        }}
      />
    </div>
  );
}