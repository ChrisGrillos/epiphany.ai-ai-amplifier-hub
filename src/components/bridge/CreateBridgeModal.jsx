import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CreateBridgeModal({ open, onOpenChange, vaultId, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    context_level: 'summary_only',
    external_llm: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const bridgeUrl = `https://bridge.epiphany-ai.com/${Math.random().toString(36).substr(2, 9)}`;
      
      await base44.entities.BridgeConversation.create({
        vault_id: vaultId,
        title: formData.title,
        context_level: formData.context_level,
        bridge_url: bridgeUrl,
        participants: [
          { type: 'user', name: 'You' },
          { type: 'epi', name: 'Epi' },
          { type: 'external_llm', name: formData.external_llm || 'External LLM' }
        ],
        messages: [],
        status: 'active'
      });

      toast.success('Bridge conversation created');
      onSuccess();
      setFormData({ title: '', context_level: 'summary_only', external_llm: '' });
    } catch (error) {
      toast.error('Failed to create bridge');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Create Bridge Conversation</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Set up a secure space where you, Epi, and external LLMs can collaborate
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Conversation Title *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
              placeholder="Project Planning Session"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="external_llm">External LLM Name</Label>
            <Input
              id="external_llm"
              value={formData.external_llm}
              onChange={(e) => setFormData({ ...formData, external_llm: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
              placeholder="ChatGPT, Claude, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context_level">Context Exposure Level *</Label>
            <Select value={formData.context_level} onValueChange={(v) => setFormData({ ...formData, context_level: v })}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="minimal">Minimal - No vault data</SelectItem>
                <SelectItem value="summary_only">Summary Only - Living Summary access</SelectItem>
                <SelectItem value="full_context">Full Context - Complete vault access</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">
              Controls how much vault information external participants can see
            </p>
          </div>

          <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3 text-xs text-violet-300">
            <p className="font-semibold mb-1">🔒 Security Note</p>
            <p>Bridge conversations run on neutral infrastructure. External LLMs only see what you explicitly share through the bridge.</p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500">
              Create Bridge
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}