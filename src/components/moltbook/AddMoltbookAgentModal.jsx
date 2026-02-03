import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AddMoltbookAgentModal({ open, onOpenChange, vaultId, onSuccess }) {
  const [formData, setFormData] = useState({
    agent_id: '',
    agent_name: '',
    description: '',
    api_endpoint: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await base44.entities.MoltbookAgent.create({
        ...formData,
        connection_type: 'manual',
        status: 'active',
        vault_id: vaultId,
        capabilities: []
      });
      toast.success('Agent connected');
      onSuccess();
      setFormData({ agent_id: '', agent_name: '', description: '', api_endpoint: '' });
    } catch (error) {
      toast.error('Failed to connect agent');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Add Moltbook Agent</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Manually connect a Moltbook agent using its credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent_id">Agent ID *</Label>
            <Input
              id="agent_id"
              required
              value={formData.agent_id}
              onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
              placeholder="agent_123abc"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent_name">Agent Name *</Label>
            <Input
              id="agent_name"
              required
              value={formData.agent_name}
              onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
              placeholder="My Assistant Agent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
              placeholder="What does this agent do?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_endpoint">Custom API Endpoint (optional)</Label>
            <Input
              id="api_endpoint"
              value={formData.api_endpoint}
              onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
              placeholder="https://api.moltbook.com/agents/..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500">
              Connect Agent
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}